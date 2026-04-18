const User = require('../models/User');
const LeaveRequest = require('../models/LeaveRequest');
const Attendance = require('../models/Attendance');
const Task = require('../models/Task');
const Project = require('../models/Project');

// HR Pulse
exports.getHRPulse = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tonight = new Date(today);
        tonight.setHours(23, 59, 59, 999);

        const [totalEmployees, onLeaveCount, attendanceDocs] = await Promise.all([
            User.countDocuments({ active_inactive: true }),
            LeaveRequest.countDocuments({
                status: 'Approved',
                startDate: { $lte: tonight },
                endDate: { $gte: today }
            }),
            Attendance.find({
                date: { $gte: today, $lte: tonight },
                'checkIn.time': { $exists: true }
            }).select('employeeId')
        ]);

        const presentCount = attendanceDocs.length;
        const expectedPresent = Math.max(0, totalEmployees - onLeaveCount);
        
        // Pulse: How many of the people NOT on leave have checked in today?
        const pulsePercentage = expectedPresent > 0 
            ? Math.min(100, Math.round((presentCount / expectedPresent) * 100)) 
            : 0;

        res.json({
            totalEmployees,
            onLeaveToday: onLeaveCount,
            presentToday: presentCount,
            absentToday: Math.max(0, expectedPresent - presentCount),
            pulsePercentage
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching HR pulse', error: error.message });
    }
};

// Manager Deadlines
exports.getManagerDeadlines = async (req, res) => {
    try {
        const managerId = req.user._id || req.user.id;
        const now = new Date();
        const fortyEightHoursLater = new Date(now.getTime() + (48 * 60 * 60 * 1000));

        // Find team members
        const team = await User.find({ reportingManager: managerId }).select('_id firstName lastName').lean();
        const teamIds = team.map(u => String(u._id));

        if (teamIds.length === 0) {
            return res.json({ overdue: [], approaching: [], onTrack: 0 });
        }

        // Find active tasks for team
        const activeTasks = await Task.find({
            assignedTo: { $in: teamIds },
            status: { $ne: 'done' }
        }).populate('projectId', 'title').sort({ dueDate: 1 }).lean();

        const overdue = [];
        const approaching = [];
        let onTrack = 0;

        activeTasks.forEach(task => {
            if (task.dueDate) {
                const dueDate = new Date(task.dueDate);
                if (dueDate < now) {
                    overdue.push({
                        _id: task._id,
                        title: task.title,
                        projectName: task.projectId?.title || 'Unknown Project',
                        dueDate: task.dueDate,
                        assignedToName: task.assignedToName
                    });
                } else if (dueDate <= fortyEightHoursLater) {
                    approaching.push({
                        _id: task._id,
                        title: task.title,
                        projectName: task.projectId?.title || 'Unknown Project',
                        dueDate: task.dueDate,
                        assignedToName: task.assignedToName
                    });
                } else {
                    onTrack++;
                }
            } else {
                onTrack++;
            }
        });

        res.json({
            overdue: overdue.slice(0, 5), // Top 5
            approaching: approaching.slice(0, 5), // Top 5
            totalOverdue: overdue.length,
            totalApproaching: approaching.length,
            onTrackCount: onTrack
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching manager deadlines', error: error.message });
    }
};
