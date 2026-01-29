const mongoose = require('mongoose');
const User = require('./models/User');
const LeaveRequest = require('./models/LeaveRequest');
require('dotenv').config();

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/smartcms';

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB');

        try {
            const shrey = await User.findOne({ email: 'shrey@gmail.com' });
            const atik = await User.findOne({ email: 'atikmanager@gmail.com' });

            console.log('--- User Details ---');
            if (shrey) {
                console.log(`Employee (Shrey): ID=${shrey._id}, ManagerID=${shrey.reportingManager}`);
            } else {
                console.log('User shrey@gmail.com NOT FOUND');
            }

            if (atik) {
                console.log(`Manager (Atik): ID=${atik._id}, EmpID=${atik.employeeId}`);
            } else {
                console.log('User atikmanager@gmail.com NOT FOUND');
            }

            console.log('\n--- Leave Requests ---');
            if (shrey) {
                const leaves = await LeaveRequest.find({ userId: shrey._id });
                console.log(`Found ${leaves.length} leave requests for Shrey.`);
                leaves.forEach(l => {
                    console.log(`- LeaveID: ${l._id}, ManagerID stored: ${l.managerId}, Status: ${l.status}`);
                });
            }

        } catch (err) {
            console.error('Error:', err);
        } finally {
            mongoose.disconnect();
        }
    })
    .catch(err => console.error('DB Connection Error:', err));
