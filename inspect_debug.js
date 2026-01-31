const mongoose = require('mongoose');
const User = require('./backend/models/User');
const LeaveRequest = require('./backend/models/LeaveRequest');
require('dotenv').config({ path: './backend/.env' });

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const employee = await User.findOne({ email: 'chintu@gmail.com' });
        const manager = await User.findOne({ email: 'atikamanager@gmail.com' });

        console.log('--- Employee (Chintu) ---');
        if (employee) {
            console.log('ID:', employee._id);
            console.log('Reporting Manager Field:', employee.reportingManager);
        } else {
            console.log('Not found');
        }

        console.log('--- Manager (Atika) ---');
        if (manager) {
            console.log('ID:', manager._id);
            console.log('Email:', manager.email);
        } else {
            console.log('Not found');
        }

        if (employee) {
            const leaves = await LeaveRequest.find({ userId: employee._id });
            console.log('--- Leaves for Chintu ---');
            leaves.forEach(l => {
                console.log(`ID: ${l._id}, ManagerID stored: ${l.managerId}, Status: ${l.status}`);
            });
        }

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.has(0) && await mongoose.disconnect(); // Close if connected
    }
}

checkData();
