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

        const [totalEmployees, onLeaveDocs, attendanceDocs, allActiveUsers] = await Promise.all([
            User.countDocuments({ active_inactive: true }),
            LeaveRequest.find({
                status: 'Approved',
                startDate: { $lte: tonight },
                endDate: { $gte: today }
            }).populate('userId', 'firstName lastName department'),
            Attendance.find({
                date: { $gte: today, $lte: tonight },
                'checkIn.time': { $exists: true }
            }).select('employeeId'),
            User.find({ active_inactive: true }).select('firstName lastName dateOfBirth joiningDate department createdAt')
        ]);

        const presentCount = attendanceDocs.length;
        const onLeaveCount = onLeaveDocs.length;
        const expectedPresent = Math.max(0, totalEmployees - onLeaveCount);
        
        const pulsePercentage = expectedPresent > 0 
            ? Math.min(100, Math.round((presentCount / expectedPresent) * 100)) 
            : 0;

        // Calculate Celebrations (Today)
        const month = today.getMonth() + 1;
        const day = today.getDate();
        
        const celebrations = allActiveUsers.filter(u => {
            if (!u.dateOfBirth && !u.joiningDate) return false;
            const bday = u.dateOfBirth ? new Date(u.dateOfBirth) : null;
            const anniv = u.joiningDate ? new Date(u.joiningDate) : null;
            
            return (bday && (bday.getMonth() + 1 === month && bday.getDate() === day)) ||
                   (anniv && (anniv.getMonth() + 1 === month && anniv.getDate() === day));
        }).map(u => ({
            name: `${u.firstName} ${u.lastName || ''}`.trim(),
            type: (new Date(u.dateOfBirth).getMonth() + 1 === month && new Date(u.dateOfBirth).getDate() === day) ? 'birthday' : 'anniversary',
            department: u.department
        }));

        // Calculate New Joinees (Last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const newJoinees = allActiveUsers
            .filter(u => u.joiningDate && new Date(u.joiningDate) >= thirtyDaysAgo)
            .sort((a, b) => new Date(b.joiningDate) - new Date(a.joiningDate))
            .slice(0, 5)
            .map(u => ({
                name: `${u.firstName} ${u.lastName || ''}`.trim(),
                department: u.department,
                joiningDate: u.joiningDate
            }));

        res.json({
            totalEmployees,
            onLeaveToday: onLeaveCount,
            presentToday: presentCount,
            absentToday: Math.max(0, expectedPresent - presentCount),
            pulsePercentage,
            celebrations,
            newJoinees,
            onLeaveNames: onLeaveDocs.map(l => ({
                name: l.userId ? `${l.userId.firstName} ${l.userId.lastName || ''}`.trim() : 'Unknown',
                department: l.userId ? l.userId.department : 'General'
            }))
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
