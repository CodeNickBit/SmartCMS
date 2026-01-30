const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function fixData() {
    try {
        if (!process.env.MONGO_URI) {
            process.exit(1);
        }
        await mongoose.connect(process.env.MONGO_URI);

        // 1. Find the user 'chintu' to see what ID they are looking for
        const chintu = await User.findOne({ email: 'chintu@gmail.com' });
        if (!chintu) {
            console.log('Chintu not found');
            return;
        }
        const targetId = String(chintu.reportingManager).trim();
        console.log(`Chintu is reporting to: ${targetId}`);

        // 2. Find the manager 'atikamanager@gmail.com'
        // Also try the typo version the user mentioned if the real one isn't found
        let manager = await User.findOne({ email: 'atikamanager@gmail.com' });
        if (!manager) {
            console.log('Manager atikamanager@gmail.com not found. Checking typo...');
            manager = await User.findOne({ email: 'atikamanger@gmail.com' });
        }

        if (manager) {
            console.log(`Found manager: ${manager.email}. Current EmployeeID: ${manager.employeeId}`);
            // Update their EmployeeID to match what Chintu expects
            manager.employeeId = targetId;
            await manager.save({ validateBeforeSave: false }); // Bypass validation if needed to force ID
            console.log(`Updated manager ${manager.email} to have EmployeeID: ${targetId}`);
        } else {
            console.log('Manager not found anywhere.');
        }

    } catch (err) {
        console.error(err);
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    }
}

fixData();
