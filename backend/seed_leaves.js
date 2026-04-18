const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const LeavePolicy = require('./models/LeavePolicy');
const LeaveBalance = require('./models/LeaveBalance');
const User = require('./models/User');
const Manager = require('./models/Manager');
const Hr = require('./models/Hr');

const seedLeaves = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        const policies = [
            {
                leaveName: 'Annual / Privilege Leave',
                description: 'Paid time off for vacation, rest, and personal reasons.',
                allowedRoles: ['employee', 'manager', 'hr'],
                annualLimit: 18,
                minNoticeHours: 168 // 7 days notice
            },
            {
                leaveName: 'Sick Leave',
                description: 'Time off for medical illness, recovery, or appointments.',
                allowedRoles: ['employee', 'manager', 'hr'],
                annualLimit: 12,
                minNoticeHours: 0
            },
            {
                leaveName: 'Casual Leave',
                description: 'Short term leave for unexpected or urgent personal matters.',
                allowedRoles: ['employee', 'manager', 'hr'],
                annualLimit: 8,
                minNoticeHours: 24 // 1 day notice
            },
            {
                leaveName: 'Maternity/Paternity Leave',
                description: 'Time off for the birth or adoption of a child.',
                allowedRoles: ['employee', 'manager', 'hr'],
                annualLimit: 180, // Equivalent to about 26 weeks for maternity in India
                minNoticeHours: 720 // 30 days notice
            },
            {
                leaveName: 'Bereavement Leave',
                description: 'Paid leave upon the death of an immediate family member.',
                allowedRoles: ['employee', 'manager', 'hr'],
                annualLimit: 5,
                minNoticeHours: 0
            }
        ];

        await LeavePolicy.deleteMany({});
        await LeavePolicy.insertMany(policies);
        console.log('Industrial-standard leave policies seeded successfully.');

        // Setup leave balances for all users so the frontend can retrieve them!
        const allEmployees = await User.find({ role: 'employee' });
        const allManagers = await Manager.find({});
        const allHrs = await Hr.find({});
        
        const allUserIds = [
            ...allEmployees.map(u => u._id.toString()),
            ...allManagers.map(u => u._id.toString()),
            ...allHrs.map(u => u._id.toString())
        ];

        await LeaveBalance.deleteMany({});
        const currentYear = new Date().getFullYear();

        const balancesToInsert = [];
        for (const uid of allUserIds) {
            for (const pol of policies) {
                 balancesToInsert.push({
                    userId: uid,
                    year: currentYear,
                    leaveType: pol.leaveName,
                    openingBalance: pol.annualLimit,
                    used: 0,
                    carryForward: 0,
                    encashed: 0,
                    lapsed: 0,
                    closingBalance: pol.annualLimit
                 });
            }
        }
        
        await LeaveBalance.insertMany(balancesToInsert);

        console.log(`Leave balances allocated to ${allUserIds.length} members for ${currentYear}.`);
        process.exit(0);
    } catch (e) {
        console.log(e);
        process.exit(1);
    }
};

seedLeaves();
