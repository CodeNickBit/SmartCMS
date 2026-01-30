const LeaveRequest = require('../models/LeaveRequest');
const User = require('../models/User');

const LeavePolicy = require('../models/LeavePolicy');

exports.applyForLeave = async (req, res) => {
    try {
        const { userId, leaveType, startDate, endDate, reason, leaveUnit, halfDayPeriod } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if user has a reporting manager string
        // This could be an Email (old data) or an Employee ID (new data/frontend behavior)
        const managerIdentifier = user.reportingManager ? String(user.reportingManager).trim() : null;

        if (!managerIdentifier) {
            return res.status(400).json({ message: 'No reporting manager assigned to your profile. Please contact HR.' });
        }

        // Try finding by Email OR EmployeeId OR valid MongoId
        let managerQuery = {
            $or: [
                { email: { $regex: new RegExp(`^${managerIdentifier}$`, 'i') } },
                { employeeId: managerIdentifier }
            ]
        };

        // If it looks like a Mongo ID (24 hex chars), add that to query
        if (/^[0-9a-fA-F]{24}$/.test(managerIdentifier)) {
            managerQuery.$or.push({ _id: managerIdentifier });
        }

        const managerUser = await User.findOne(managerQuery);

        // If manager not found in system
        if (!managerUser) {
            return res.status(400).json({ message: `Reporting manager (${managerIdentifier}) not found in the system. Please verify the manager's Employee ID or Email with HR.` });
        }

        const managerId = String(managerUser._id);

        const start = new Date(startDate);
        const end = new Date(endDate);
        const now = new Date();

        // 1. Validate Dates
        if (start > end) {
            return res.status(400).json({ message: 'Start date cannot be after end date' });
        }

        if (leaveUnit === 'half-day') {
            // For half-day, start and end date must be same (conceptually)
            // If frontend sends range, we should enforce single day or check logic
            if (startDate !== endDate && start.toDateString() !== end.toDateString()) {
                return res.status(400).json({ message: 'Half-day leave must be for a single day.' });
            }
        }

        // 2. Fetch Policy for Limits & Rules
        const policy = await LeavePolicy.findOne({ leaveName: leaveType, isActive: true });
        if (!policy) {
            return res.status(400).json({ message: `Leave policy not found for type: ${leaveType}` });
        }

        // 3. Check Minimum Notice Period
        if (policy.minNoticeHours > 0) {
            const hoursDiff = (start - now) / (1000 * 60 * 60);
            if (hoursDiff < policy.minNoticeHours) {
                return res.status(400).json({
                    message: `Policy violation: ${leaveType} requires ${policy.minNoticeHours} hours notice.`
                });
            }
        }

        // 4. Check Date Conflicts (Prevent Double Booking)
        const overlapping = await LeaveRequest.findOne({
            userId,
            status: { $in: ['Pending', 'Approved', 'Changes Requested'] },
            $or: [
                { startDate: { $lte: end }, endDate: { $gte: start } }
            ]
        });

        // Refine overlap check for half-days (allow 2 half days on same day if periods differ)
        if (overlapping) {
            let isRealOverlap = true;
            if (leaveUnit === 'half-day' && overlapping.leaveUnit === 'half-day') {
                if (overlapping.startDate.toDateString() === start.toDateString() && overlapping.halfDayPeriod !== halfDayPeriod) {
                    isRealOverlap = false; // Different halves of same day
                }
            }

            if (isRealOverlap) {
                return res.status(400).json({
                    message: `You already have a leave request for this period (${overlapping.startDate.toISOString().split('T')[0]}).`
                });
            }
        }

        // 5. Check Balance (Prevent Exceeding Limit)
        // Calculate requested days
        let requestedDays = 0;
        if (leaveUnit === 'half-day') {
            requestedDays = 0.5;
        } else {
            const diffTime = Math.abs(end - start);
            requestedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        }

        // Fetch used days for this leave type in current year
        const currentYear = new Date().getFullYear();
        const startOfYear = new Date(currentYear, 0, 1);
        const endOfYear = new Date(currentYear, 11, 31);

        const usedLeaves = await LeaveRequest.find({
            userId,
            leaveType,
            status: 'Approved',
            startDate: { $gte: startOfYear, $lte: endOfYear }
        });

        let usedDays = 0;
        usedLeaves.forEach(l => {
            if (l.leaveUnit === 'half-day') {
                usedDays += 0.5;
            } else {
                const s = new Date(l.startDate);
                const e = new Date(l.endDate);
                const d = Math.ceil(Math.abs(e - s) / (1000 * 60 * 60 * 24)) + 1;
                usedDays += d;
            }
        });

        if (usedDays + requestedDays > policy.annualLimit) {
            return res.status(400).json({
                message: `Insufficient balance. You have ${policy.annualLimit - usedDays} days remaining, but requested ${requestedDays} days.`
            });
        }

        const newLeave = new LeaveRequest({
            userId,
            leaveType,
            startDate,
            endDate,
            reason,
            managerId,
            leaveUnit,
            halfDayPeriod: leaveUnit === 'half-day' ? halfDayPeriod : undefined,
            attachments: req.files ? req.files.map(f => ({
                filename: f.filename,
                path: f.path,
                uploadedAt: new Date()
            })) : []
        });

        console.log('=== LEAVE REQUEST DEBUG ===');
        console.log('Employee ID:', userId);
        console.log('Manager ID:', managerId);
        console.log('Leave Type:', leaveType);
        console.log('===========================');

        await newLeave.save();
        res.status(201).json(newLeave);
    } catch (error) {
        res.status(500).json({ message: 'Error applying for leave', error: error.message });
    }
};

// Update Leave Request (Employee: Edit Pending Request)
exports.updateLeaveRequest = async (req, res) => {
    try {
        const { leaveType, startDate, endDate, reason } = req.body;
        const leave = await LeaveRequest.findById(req.params.id);

        if (!leave) {
            return res.status(404).json({ message: 'Leave request not found' });
        }

        if (leave.status !== 'Pending' && leave.status !== 'Changes Requested') {
            return res.status(400).json({ message: 'Only pending or change-requested leaves can be edited.' });
        }

        // Capture history
        if (leaveType !== leave.leaveType) {
            leave.modificationHistory.push({ field: 'leaveType', oldValue: leave.leaveType, newValue: leaveType });
        }
        if (new Date(startDate).toISOString() !== leave.startDate.toISOString()) {
            leave.modificationHistory.push({ field: 'startDate', oldValue: leave.startDate, newValue: startDate });
        }
        if (new Date(endDate).toISOString() !== leave.endDate.toISOString()) {
            leave.modificationHistory.push({ field: 'endDate', oldValue: leave.endDate, newValue: endDate });
        }

        // Apply changes
        leave.leaveType = leaveType;
        leave.startDate = new Date(startDate);
        leave.endDate = new Date(endDate);
        leave.reason = reason;
        leave.lastModifiedAt = new Date();

        // If it was 'Changes Requested', reset to 'Pending' so manager sees it again
        if (leave.status === 'Changes Requested') {
            leave.status = 'Pending';
        }

        // Re-validate (Simplified for now - ideally re-run full validation logic)
        // Note: For production, extract validation logic from applyForLeave into a helper function and reuse it here.

        await leave.save();
        res.json(leave);
    } catch (error) {
        res.status(500).json({ message: 'Error updating leave request', error: error.message });
    }
};

// Cancel Leave Request (Employee)
exports.cancelLeave = async (req, res) => {
    try {
        const leave = await LeaveRequest.findById(req.params.id);
        if (!leave) {
            return res.status(404).json({ message: 'Leave request not found' });
        }

        // Ensure user owns the request (In a real app, check req.user._id)
        // For now, assuming logic is handled or trusting client ID matching user context 
        // Ideally we should check if (leave.userId !== req.body.userId) return 403;

        if (leave.status !== 'Pending') {
            return res.status(400).json({ message: 'Only pending requests can be cancelled.' });
        }

        leave.status = 'Cancelled';
        await leave.save();
        res.json({ message: 'Leave request cancelled successfully', leave });
    } catch (error) {
        res.status(500).json({ message: 'Error cancelling leave', error: error.message });
    }
};

// Get My Leaves (Employee)
exports.getMyLeaves = async (req, res) => {
    try {
        const leaves = await LeaveRequest.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching leaves', error: error.message });
    }
};

exports.getManagerLeaves = async (req, res) => {
    try {
        const managerId = req.params.managerId;
        console.log('=== FETCHING MANAGER LEAVES ===');
        console.log('Manager ID:', managerId);

        const leaves = await LeaveRequest.find({ managerId })
            .populate('userId', 'firstName lastName designation department')
            .sort({ createdAt: -1 });

        console.log('Found leaves count:', leaves.length);
        console.log('================================');

        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching leave requests', error: error.message });
    }
};

exports.updateLeaveStatus = async (req, res) => {
    try {
        const leave = await LeaveRequest.findById(req.params.id);
        if (!leave) {
            return res.status(404).json({ message: 'Leave request not found' });
        }

        const callerId = req.user && req.user._id ? String(req.user._id) : null;
        if (!callerId || leave.managerId !== callerId) {
            return res.status(403).json({ message: 'Only the reporting manager can approve or reject this leave' });
        }

        if (leave.status !== 'Pending') {
            return res.status(400).json({ message: 'Leave request has already been processed' });
        }

        const { status, rejectionReason, managerComments } = req.body;

        const updateData = { status };

        if (status === 'Rejected') {
            updateData.rejectionReason = rejectionReason;
        }

        if (status === 'Changes Requested') {
            updateData.managerComments = managerComments;
        }

        const updated = await LeaveRequest.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Error updating leave status', error: error.message });
    }
};

exports.getTeamCalendar = async (req, res) => {
    try {
        const { managerId } = req.params;
        // Find all users who report to this manager
        const reports = await User.find({ reportingManager: managerId }).select('_id firstName lastName');

        if (!reports.length) {
            return res.json([]);
        }

        const reportIds = reports.map(r => r._id);

        // Fetch approved leaves for these users
        const leaves = await LeaveRequest.find({
            userId: { $in: reportIds },
            status: 'Approved' // Only show approved leaves on calendar
        }).populate('userId', 'firstName lastName');

        res.json(leaves);
    } catch (error) {
        console.error('Error fetching team calendar:', error);
        res.status(500).json({ message: 'Server error fetching team calendar' });
    }
};
