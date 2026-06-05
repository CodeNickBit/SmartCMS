require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

// Use the same connection string as server.js
const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/smartcms';

console.log('Connecting to:', MONGODB_URI);

mongoose.connect(MONGODB_URI)
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

async function fixRelationship() {
    try {
        console.log('\n=== FIXING CHINTU -> ATIKAMANAGER RELATIONSHIP ===\n');

        // 1. precise search for manager (using email provided by user)
        // Note: User said "atikamanager@gmail.com" (extra 'a' after atik)
        let manager = await User.findOne({ email: 'atikamanager@gmail.com' });

        if (!manager) {
            console.log('❌ Manager "atikamanager@gmail.com" not found. Trying "atikmanager@gmail.com"...');
            manager = await User.findOne({ email: 'atikmanager@gmail.com' });
        }

        if (!manager) {
            console.log('❌ Manager not found with either spelling!');

            // Search loosely
            const managers = await User.find({ role: 'manager' });
            console.log('Available managers:', managers.map(m => `${m.firstName} (${m.email})`));
            return;
        }

        console.log(`✅ Manager Found: ${manager.firstName} ${manager.lastName} (${manager.email})`);
        console.log(`   ID: ${manager._id}`);

        // 2. precise search for employee
        let employee = await User.findOne({ email: 'chintu@gmail.com' });

        if (!employee) {
            console.log('❌ Employee "chintu@gmail.com" not found. Searching loosely...');
            const users = await User.find({ email: /chintu/i });
            if (users.length > 0) {
                employee = users[0];
                console.log(`Found similar user: ${employee.email}`);
            } else {
                console.log('No user found with "chintu" in email.');
                return;
            }
        }

        console.log(`✅ Employee Found: ${employee.firstName} ${employee.lastName} (${employee.email})`);
        console.log(`   Current Reporting Manager: ${employee.reportingManager || 'NONE'}`);

        // 3. Update Relationship
        if (employee.reportingManager !== manager._id.toString()) {
            console.log('\nUpdating relationship...');
            employee.reportingManager = manager._id.toString();
            await employee.save();
            console.log('✅ SUCCESS: Employee now reports to Manager');
        } else {
            console.log('\n✅ Relationship is already correct.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.connection.close();
    }
}

fixRelationship();
