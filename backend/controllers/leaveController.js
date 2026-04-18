const LeaveRequest = require('../models/LeaveRequest');
const User = require('../models/User');
const Manager = require('../models/Manager');
const LeavePolicy = require('../models/LeavePolicy');
const Hr = require('../models/Hr');
const { sendEscalationEmail } = require('../utils/mailer');

const validateLeaveRequest = async (userId, leaveType, startDate, endDate, leaveUnit, halfDayPeriod, currentLeaveId = null) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (start > end) {
        return { valid: false, message: 'Start date cannot be after end date', status: 400 };
    }

    if (leaveUnit === 'half-day') {
        if (startDate !== endDate && start.toDateString() !== end.toDateString()) {
            return { valid: false, message: 'Half-day leave must be for a single day.', status: 400 };
        }
    }

    const policy = await LeavePolicy.findOne({ leaveName: leaveType, isActive: true });
    if (!policy) {
        return { valid: false, message: `Leave policy not found for type: ${leaveType}`, status: 400 };
    }

    if (policy.minNoticeHours > 0) {
        const hoursDiff = (start - now) / (1000 * 60 * 60);
        if (hoursDiff < policy.minNoticeHours) {
            return { valid: false, message: `Policy violation: ${leaveType} requires ${policy.minNoticeHours} hours notice.`, status: 400 };
        }
    }

    const overlapQuery = {
        userId,
        status: { $in: ['Pending', 'Approved', 'Changes Requested'] },
        $or: [
            { startDate: { $lte: end }, endDate: { $gte: start } }
        ]
    };

    if (currentLeaveId) {
        overlapQuery._id = { $ne: currentLeaveId };
    }

    const overlapping = await LeaveRequest.findOne(overlapQuery);

    if (overlapping) {
        let isRealOverlap = true;
        if (leaveUnit === 'half-day' && overlapping.leaveUnit === 'half-day') {
            if (overlapping.startDate.toDateString() === start.toDateString() && overlapping.halfDayPeriod !== halfDayPeriod) {
                isRealOverlap = false;
            }
        }

        if (isRealOverlap) {
            return { valid: false, message: `You already have a leave request for this period (${overlapping.startDate.toISOString().split('T')[0]}).`, status: 400 };
        }
    }

    let requestedDays = 0;
    if (leaveUnit === 'half-day') {
        requestedDays = 0.5;
    } else {
        const diffTime = Math.abs(end - start);
        requestedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }

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
        return { valid: false, message: `Insufficient balance. You have ${policy.annualLimit - usedDays} days remaining, but requested ${requestedDays} days.`, status: 400 };
    }

    return { valid: true };
};

exports.applyForLeave = async (req, res) => {
    try {
        const { userId, leaveType, startDate, endDate, reason } = req.body;

        let user = await User.findById(userId);
        let isManagerOrHr = false;
        
        if (user && (user.role === 'manager' || user.role === 'hr' || user.role === 'admin')) {
            isManagerOrHr = true;
        } else if (!user) {
            user = await Manager.findById(userId);
            if (user) isManagerOrHr = true;
        }

        if (!user) {
            user = await Hr.findById(userId);
            if (user) isManagerOrHr = true;
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let managerId = null;
        let isEscalated = false;

        if (isManagerOrHr) {
            managerId = 'hr-pool';
        } else {
            const managerIdentifier = user.reportingManager ? String(user.reportingManager).trim() : null;
            if (!managerIdentifier) {
                return res.status(400).json({ message: 'No reporting manager assigned to your profile. Please contact HR.' });
            }

            let manager = null;
            if (/^[0-9a-fA-F]{24}$/.test(managerIdentifier)) {
                manager = await Manager.findById(managerIdentifier);
            }
            if (!manager) {
                manager = await Manager.findOne({ email: new RegExp(`^${managerIdentifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
            }
            if (!manager && /^[0-9]+$/.test(managerIdentifier)) {
                manager = await User.findById(managerIdentifier);
            }
            if (!manager) {
                manager = await User.findOne({ email: new RegExp(`^${managerIdentifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'), role: 'manager' });
            }
            
            if (!manager) {
                return res.status(400).json({ message: 'Reporting manager not found in the system. Please contact HR to assign a valid manager.' });
            }
            managerId = String(manager._id);

            // AUTO-ROUTING (Escalation) Check
            // Escalate if manager has an approved or pending leave overlapping the requested dates
            const managerOnLeave = await LeaveRequest.findOne({
                userId: managerId,
                status: { $in: ['Pending', 'Approved'] },
                leaveUnit: { $ne: 'half-day' },
                startDate: { $lte: new Date(endDate) },
                endDate: { $gte: new Date(startDate) }
            }).sort({ createdAt: -1 });

            if (managerOnLeave) {
                // Determine routing: Prefer Proxy Manager over HR-Pool
                if (managerOnLeave.proxyManagerId) {
                    managerId = managerOnLeave.proxyManagerId;
                    isEscalated = true; // Technically a delegated escalation
                } else {
                    managerId = 'hr-pool'; // Escalate to HR
                    isEscalated = true;
                }
            }
        }

        const validation = await validateLeaveRequest(userId, leaveType, startDate, endDate, req.body.leaveUnit, req.body.halfDayPeriod);
        if (!validation.valid) {
            return res.status(validation.status).json({ message: validation.message });
        }

        const leaveUnit = req.body.leaveUnit || 'full-day';
        const halfDayPeriod = req.body.halfDayPeriod;
        const status = 'Pending'; // Default status for new requests
        
        // Proxy Manager Support
        const proxyManagerId = req.body.proxyManagerId;

        const newLeave = new LeaveRequest({
            userId,
            leaveType,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            reason,
            status,
            managerId,
            proxyManagerId, // Save the selected proxy manager
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

        if (isEscalated && managerId === 'hr-pool') {
            const employeeName = user.firstName
                ? `${user.firstName} ${user.lastName || ''}`.trim()
                : (user.name || 'Employee');

            let originalManagerName = null;
            const managerIdentifier = user.reportingManager ? String(user.reportingManager).trim() : null;
            if (managerIdentifier) {
                const mgr = await Manager.findById(managerIdentifier).lean()
                    || await User.findById(managerIdentifier).lean();
                if (mgr) originalManagerName = mgr.name || (`${mgr.firstName || ''} ${mgr.lastName || ''}`).trim();
            }

            sendEscalationEmail({
                employeeName,
                leaveType,
                startDate,
                endDate,
                reason,
                originalManagerName
            });
        }

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

        const validation = await validateLeaveRequest(
            leave.userId,
            leaveType,
            startDate,
            endDate,
            req.body.leaveUnit || leave.leaveUnit,
            req.body.halfDayPeriod || leave.halfDayPeriod,
            leave._id
        );

        if (!validation.valid) {
            return res.status(validation.status).json({ message: validation.message });
        }

        // Re-evaluate Manager Routing if dates changed
        if (new Date(startDate).getTime() !== leave.startDate.getTime() || new Date(endDate).getTime() !== leave.endDate.getTime() || leave.status === 'Pending') {
            const User = require('../models/User');
            const Manager = require('../models/Manager');
            const Hr = require('../models/Hr');
            
            let userObj = await User.findById(leave.userId);
            let isManagerOrHr = false;
            
            if (userObj && (userObj.role === 'manager' || userObj.role === 'hr' || userObj.role === 'admin')) {
                isManagerOrHr = true;
            } else if (!userObj) {
                userObj = await Manager.findById(leave.userId);
                if (userObj) isManagerOrHr = true;
            }
            if (!userObj) {
                userObj = await Hr.findById(leave.userId);
                if (userObj) isManagerOrHr = true;
            }

            if (userObj && !isManagerOrHr) {
                const managerIdentifier = userObj.reportingManager ? String(userObj.reportingManager).trim() : null;
                if (managerIdentifier) {
                    let actualManager = null;
                    if (/^[0-9a-fA-F]{24}$/.test(managerIdentifier)) {
                        actualManager = await Manager.findById(managerIdentifier);
                    }
                    if (!actualManager) {
                        actualManager = await Manager.findOne({ email: new RegExp(`^${managerIdentifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
                    }
                    if (!actualManager && /^[0-9]+$/.test(managerIdentifier)) {
                        actualManager = await User.findById(managerIdentifier);
                    }
                    if (!actualManager) {
                        actualManager = await User.findOne({ email: new RegExp(`^${managerIdentifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'), role: 'manager' });
                    }
                    
                    if (actualManager) {
                        let originalManagerId = String(actualManager._id);
                        
                        // Check if original manager is on leave for the NEW dates
                        const managerOnLeave = await LeaveRequest.findOne({
                            userId: originalManagerId,
                            status: { $in: ['Pending', 'Approved'] },
                            leaveUnit: { $ne: 'half-day' },
                            startDate: { $lte: new Date(endDate) },
                            endDate: { $gte: new Date(startDate) }
                        }).sort({ createdAt: -1 });

                        if (managerOnLeave) {
                            if (managerOnLeave.proxyManagerId) {
                                leave.managerId = managerOnLeave.proxyManagerId;
                            } else {
                                leave.managerId = 'hr-pool';
                                const empName = userObj.firstName
                                    ? `${userObj.firstName} ${userObj.lastName || ''}`.trim()
                                    : (userObj.name || 'Employee');
                                const mgr = await Manager.findById(originalManagerId).lean()
                                    || await User.findById(originalManagerId).lean();
                                const originalManagerName = mgr
                                    ? (mgr.name || (`${mgr.firstName || ''} ${mgr.lastName || ''}`).trim())
                                    : null;
                                sendEscalationEmail({
                                    employeeName: empName,
                                    leaveType: leave.leaveType,
                                    startDate: leave.startDate,
                                    endDate: leave.endDate,
                                    reason: leave.reason,
                                    originalManagerName
                                });
                            }
                        } else {
                            leave.managerId = originalManagerId;
                        }
                    }
                }
            } else if (isManagerOrHr) {
                leave.managerId = 'hr-pool';
            }
        }

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

        // Ensure user owns the request
        const requestingUserId = (req.user && (req.user.id || req.user._id)) ? String(req.user.id || req.user._id) : req.body.userId;
        if (leave.userId !== String(requestingUserId)) {
            return res.status(403).json({ message: 'Unauthorized to cancel this leave request.' });
        }

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

        const Admin = require('../models/Admin');
        
        let isHr = false;
        let isAdmin = false;

        if (/^[0-9a-fA-F]{24}$/.test(managerId)) {
            isHr = await Hr.findById(managerId);
            isAdmin = await Admin.findById(managerId);
        }

        const queryOr = [{ managerId }];
        if (isHr || isAdmin) {
            queryOr.push({ managerId: 'hr-pool' });
        }

        const leaves = await LeaveRequest.find({ $or: queryOr })
            .sort({ createdAt: -1 })
            .lean();

        for (let leave of leaves) {
            let fallbackId = leave.userId;
            
            // Try User collection first (covers Employee and User-Managers)
            const dbUser = await User.findById(fallbackId, 'firstName lastName name designation department role reportingManager').lean();
            if (dbUser) {
                leave.userId = dbUser;
                leave.userDetails = { 
                    firstName: dbUser.firstName, 
                    lastName: dbUser.lastName, 
                    designation: dbUser.designation || (dbUser.role === 'manager' ? 'Manager' : 'Employee'), 
                    department: dbUser.department,
                    reportingManager: dbUser.reportingManager 
                };
                leave.userId.designation = leave.userDetails.designation;
            } else {
                const mgr = await Manager.findById(fallbackId, 'name designation department role reportingManager').lean();
                if (mgr) {
                    mgr.firstName = mgr.name;
                    mgr.designation = mgr.designation || 'Manager';
                    leave.userId = mgr;
                    leave.userDetails = { firstName: mgr.name, lastName: '', designation: mgr.designation, department: mgr.department, reportingManager: mgr.reportingManager };
                } else {
                    const hrCall = await Hr.findById(fallbackId, 'name designation department role reportingManager').lean();
                    if (hrCall) {
                        hrCall.firstName = hrCall.name;
                        hrCall.designation = hrCall.designation || 'HR';
                        leave.userId = hrCall;
                        leave.userDetails = { firstName: hrCall.name, lastName: '', designation: hrCall.designation, department: hrCall.department, reportingManager: hrCall.reportingManager };
                    }
                }
            }

            // Flag escalated leaves with original manager name
            if (leave.managerId === 'hr-pool' && leave.userDetails && leave.userDetails.reportingManager) {
                try {
                    const rMid = leave.userDetails.reportingManager;
                    const mgrEsc = await Manager.findById(rMid, 'name').lean() 
                        || await Hr.findById(rMid, 'name').lean() 
                        || await User.findById(rMid, 'firstName lastName name').lean();
                    if (mgrEsc) {
                        leave.escalatedFromManager = mgrEsc.name || (`${mgrEsc.firstName || ''} ${mgrEsc.lastName || ''}`).trim();
                    }
                } catch (e) {
                    console.error('Failed fetching escalated manager:', e);
                }
            }
        }

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
        const callerRole = req.user ? req.user.role : null;
        
        const isHrOrAdmin = callerRole === 'admin' || callerRole === 'hr';

        if (!callerId || (!isHrOrAdmin && leave.managerId !== callerId)) {
            return res.status(403).json({ message: 'Only the reporting manager or HR/Admin can approve or reject this leave' });
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

        const originalManagerId = leave.managerId;
        const actingAsProxy = !isHrOrAdmin && callerId !== originalManagerId;
        const actingAsHr = isHrOrAdmin && leave.managerId === 'hr-pool';

        if (actingAsHr || actingAsProxy) {
            updateData.resolvedWhileManagerAway = true;
            updateData.resolvedBy = callerId;
        }

        const oldStatus = leave.status;
        const updated = await LeaveRequest.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        // Send a Notification only if status changed from Pending to Approved/Rejected
        if (oldStatus === 'Pending' && (status === 'Approved' || status === 'Rejected')) {
            const { createNotification } = require('../utils/notificationHelper');
            console.log(`[Notification-Debug] Sending ${status} notification for leave ${updated._id} to user ${leave.userId}`);
            createNotification(
                leave.userId,
                `Leave Request ${status}`,
                `Your leave request from ${new Date(leave.startDate).toLocaleDateString()} to ${new Date(leave.endDate).toLocaleDateString()} has been ${status.toLowerCase()}.`,
                'Leave',
                String(updated._id)
            ).catch(err => console.error('[Notification-Error]', err));
        }

        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Error updating leave status', error: error.message });
    }
};

exports.getTeamCalendar = async (req, res) => {
    try {
        const { managerId } = req.params;
        const reports = await User.find({ reportingManager: managerId }).select('_id firstName lastName');

        const reportIds = reports.map(r => r._id);

        const teamLeaves = reportIds.length
            ? await LeaveRequest.find({
                userId: { $in: reportIds },
                status: 'Approved'
            }).populate('userId', 'firstName lastName')
            : [];

        const managerLeaves = await LeaveRequest.find({
            userId: managerId,
            status: 'Approved'
        }).lean();

        let managerName = 'Manager';
        const mgr = await Manager.findById(managerId, 'name').lean()
            || await User.findById(managerId, 'firstName lastName name').lean();
        if (mgr) managerName = mgr.name || (`${mgr.firstName || ''} ${mgr.lastName || ''}`).trim();

        const taggedManagerLeaves = managerLeaves.map(l => ({
            ...l,
            isManagerLeave: true,
            managerName
        }));

        res.json([...teamLeaves, ...taggedManagerLeaves]);
    } catch (error) {
        console.error('Error fetching team calendar:', error);
        res.status(500).json({ message: 'Server error fetching team calendar' });
    }
};

exports.getReturnDigest = async (req, res) => {
    try {
        const { managerId } = req.params;
        const Hr = require('../models/Hr');

        const reports = await User.find({ reportingManager: managerId }).select('_id firstName lastName').lean();
        const reportIds = reports.map(r => String(r._id));

        const digestLeaves = await LeaveRequest.find({
            userId: { $in: reportIds },
            resolvedWhileManagerAway: true,
            status: { $in: ['Approved', 'Rejected'] }
        }).sort({ updatedAt: -1 }).lean();

        for (const leave of digestLeaves) {
            const emp = reports.find(r => String(r._id) === leave.userId);
            leave.employeeName = emp
                ? `${emp.firstName} ${emp.lastName || ''}`.trim()
                : leave.userId;

            if (leave.resolvedBy) {
                const resolver = await Hr.findById(leave.resolvedBy, 'name').lean()
                    || await Manager.findById(leave.resolvedBy, 'name').lean()
                    || await User.findById(leave.resolvedBy, 'firstName lastName name').lean();
                if (resolver) {
                    leave.resolvedByName = resolver.name
                        || (`${resolver.firstName || ''} ${resolver.lastName || ''}`).trim();
                }
            }
        }

        res.json(digestLeaves);
    } catch (error) {
        console.error('Error fetching return digest:', error);
        res.status(500).json({ message: 'Server error fetching return digest' });
    }
};

exports.getManagerStatus = async (req, res) => {
    try {
        const { managerId } = req.params;
        if (!managerId) return res.json({ onLeave: false });

        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

        const managerOnLeave = await LeaveRequest.findOne({
            userId: managerId,
            status: 'Approved',
            startDate: { $lt: tomorrow },
            endDate: { $gte: today }
        }).lean();

        if (!managerOnLeave) {
            return res.json({ onLeave: false });
        }

        // Fetch proxy manager details if they assigned one
        let proxyName = null;
        if (managerOnLeave.proxyManagerId) {
            const pId = managerOnLeave.proxyManagerId;
            const pm = await Manager.findById(pId, 'name').lean() 
                || await Hr.findById(pId, 'name').lean() 
                || await User.findById(pId, 'firstName lastName name').lean();
            if (pm) {
                proxyName = pm.name || (`${pm.firstName || ''} ${pm.lastName || ''}`).trim();
            }
        }

        res.json({ 
            onLeave: true, 
            proxyManagerId: managerOnLeave.proxyManagerId,
            proxyName: proxyName
        });
    } catch (error) {
        console.error('Error fetching manager status:', error);
        res.status(500).json({ message: 'Server error fetching manager status' });
    }
};
