const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const Attendance = require('../models/Attendance');
const User = require('../models/User');

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const marchStart = new Date('2026-03-01T00:00:00.000Z');
        const marchEnd = new Date('2026-03-31T23:59:59.999Z');

        const totalMarch = await Attendance.countDocuments({
            date: { $gte: marchStart, $lte: marchEnd }
        });
        console.log('Total March 2026 Attendance Records:', totalMarch);

        const targetNames = ['Gopal', 'Meet', 'Hir', 'Manush', 'Chintu', 'Shubham'];
        const emps = await User.find({ firstName: { $in: targetNames } })
            .select('_id firstName lastName salaryTemplate');

        console.log('\nEmployee Attendance for March 2026:');
        for (const emp of emps) {
            const count = await Attendance.countDocuments({
                employeeId: emp._id,
                date: { $gte: marchStart, $lte: marchEnd }
            });
            console.log(`${emp.firstName} ${emp.lastName} (${emp._id}): ${count} records, Template: ${emp.salaryTemplate ? 'Yes' : 'No'}`);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
