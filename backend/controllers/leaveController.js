const LeaveRequest = require('../models/LeaveRequest');
const User = require('../models/User');

exports.applyForLeave = async (req, res) => {
    try {
        const { userId, leaveType, startDate, endDate, reason } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const managerId = user.reportingManager ? String(user.reportingManager).trim() : null;
        if (!managerId) {
            return res.status(400).json({ message: 'No reporting manager assigned. Please contact HR.' });
        }

        const newLeave = new LeaveRequest({
            userId,
            leaveType,
            startDate,
            endDate,
            reason,
            managerId
        });

        await newLeave.save();
        res.status(201).json(newLeave);
    } catch (error) {
        res.status(500).json({ message: 'Error applying for leave', error: error.message });
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
        const leaves = await LeaveRequest.find({ managerId })
            .populate('userId', 'firstName lastName designation department')
            .sort({ createdAt: -1 });
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

        const { status, rejectionReason } = req.body;
        const updated = await LeaveRequest.findByIdAndUpdate(
            req.params.id,
            { status, rejectionReason: status === 'Rejected' ? rejectionReason : undefined },
            { new: true }
        );
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Error updating leave status', error: error.message });
    }
};
