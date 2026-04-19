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

// Admin Dashboard Stats
exports.getAdminDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        const firstDayPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastDayPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        const daysInMonth = lastDayPrevMonth.getDate();

        const [
            totalEmployees,
            totalDepartments,
            pendingLeaves,
            activeProjects,
            attendanceStats,
            deptDist,
            recentTasks,
            pendingItems,
            leaveTrendDocs,
            joinersDocs
        ] = await Promise.all([
            User.countDocuments({ active_inactive: true }),
            User.distinct('department'),
            LeaveRequest.countDocuments({ status: 'Pending' }),
            Project.countDocuments({ status: { $in: ['In Progress', 'Active', 'active'] } }),
            Attendance.find({ 
                date: { 
                    $gte: firstDayPrevMonth, 
                    $lte: lastDayPrevMonth 
                } 
            }).select('date employeeId'),
            User.aggregate([
                { $match: { active_inactive: true } },
                { $group: { _id: '$department', count: { $sum: 1 } } }
            ]),
            Task.find()
                .sort({ updatedAt: -1 })
                .limit(5),
            LeaveRequest.find({ status: 'Pending' })
                .sort({ createdAt: -1 })
                .limit(3)
                .populate('userId', 'firstName lastName'),
            LeaveRequest.find({
                status: 'Approved',
                $or: [
                    { startDate: { $lte: lastDayPrevMonth }, endDate: { $gte: firstDayPrevMonth } }
                ]
            }).select('startDate endDate'),
            User.find({
                active_inactive: true,
                joiningDate: { $gte: firstDayPrevMonth, $lte: lastDayPrevMonth }
            }).select('joiningDate')
        ]);

        // Calculate cumulative joiners to find historical headcount at start of month
        const joinersAfterThisMonth = await User.countDocuments({
            active_inactive: true,
            joiningDate: { $gt: lastDayPrevMonth }
        });
        
        // Initial headcount at end of prev month
        let currentHeadcount = totalEmployees - joinersAfterThisMonth;

        // Process pulse data
        const pulseData = [];
        // Iterate backwards to calculate historical headcount, then reverse
        for (let i = daysInMonth; i >= 1; i--) {
            const currentDay = new Date(firstDayPrevMonth.getFullYear(), firstDayPrevMonth.getMonth(), i);
            const currentDayStr = currentDay.toDateString();
            
            // Joiners on this exact day
            const dayJoiners = joinersDocs.filter(u => new Date(u.joiningDate).toDateString() === currentDayStr).length;
            
            // Active Leaves on this day
            const activeLeaves = leaveTrendDocs.filter(l => {
                const start = new Date(l.startDate);
                const end = new Date(l.endDate);
                return currentDay >= start && currentDay <= end;
            }).length;

            pulseData.push({
                day: i.toString(),
                totalStaff: currentHeadcount,
                onLeave: activeLeaves,
                newJoiners: dayJoiners
            });

            // Headcount for day before
            currentHeadcount -= dayJoiners;
        }
        pulseData.reverse();

        // Process department distribution
        const departmentData = deptDist.map((d, index) => ({
            name: d._id || 'General',
            value: totalEmployees > 0 ? Math.round((d.count / totalEmployees) * 100) : 0,
            color: ['#3083DC', '#EE964B', '#64748B', '#E1F2FE'][index % 4]
        }));

        res.json({
            statsCards: [
                { title: 'Total Employees', value: totalEmployees.toString(), change: '+ 0%', icon: 'users', color: 'bg-[#3083DC]' },
                { title: 'Departments', value: totalDepartments.length.toString(), change: '0%', icon: 'building', color: 'bg-[#EE964B]' },
                { title: 'Pending Leave', value: pendingLeaves.toString(), change: `+${pendingLeaves} New`, icon: 'calendar', color: 'bg-[#3083DC]' },
                { title: 'Active Projects', value: activeProjects.toString(), change: 'Active', icon: 'rocket', color: 'bg-[#EE964B]' }
            ],
            pulseData: pulseData,
            departmentData: departmentData,
            recentActivities: recentTasks.map(t => ({
                name: t.assignedToName || 'System',
                action: t.title,
                date: new Date(t.updatedAt).toLocaleDateString(),
                status: t.status,
                statusColor: t.status === 'done' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
            })),
            pendingApprovals: pendingItems.map(l => {
                const duration = Math.ceil((new Date(l.endDate).getTime() - new Date(l.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
                return {
                    title: 'Leave Request',
                    subtitle: `${l.leaveType} - ${duration} Days`,
                    meta: `By: ${l.userId ? l.userId.firstName : 'Unknown'}`,
                    icon: 'plane'
                };
            })
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching admin stats', error: error.message });
    }
};
