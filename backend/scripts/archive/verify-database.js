require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const LeaveRequest = require('./models/LeaveRequest');

// Use the same connection string as server.js
const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/smartcms';

console.log('\n🔍 SMART CMS DATABASE VERIFICATION\n');
console.log(`📡 Connecting to: ${MONGODB_URI}\n`);

mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ MongoDB connected successfully\n'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        process.exit(1);
    });

async function verifyDatabase() {
    try {
        // Check users
        console.log('═══════════════════════════════════════');
        console.log('📊 USER VERIFICATION');
        console.log('═══════════════════════════════════════\n');

        const totalUsers = await User.countDocuments();
        console.log(`Total users in database: ${totalUsers}\n`);

        if (totalUsers === 0) {
            console.log('⚠️  WARNING: No users found in database!');
            console.log('   This means either:');
            console.log('   1. You\'re connected to the wrong database');
            console.log('   2. Users haven\'t been created yet\n');
            console.log('💡 TIP: Check MongoDB Compass to see all databases\n');
        } else {
            // List all users
            const users = await User.find({}).select('_id firstName lastName email role reportingManager');

            console.log('👥 All Users:\n');
            users.forEach((user, index) => {
                console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
                console.log(`   📧 Email: ${user.email}`);
                console.log(`   🆔 ID: ${user._id}`);
                console.log(`   👔 Role: ${user.role}`);
                console.log(`   👤 Reports to: ${user.reportingManager || 'None'}`);
                console.log('');
            });

            // Find specific users
            console.log('═══════════════════════════════════════');
            console.log('🔎 SEARCHING FOR SPECIFIC USERS');
            console.log('═══════════════════════════════════════\n');

            const manager = await User.findOne({ email: /atikmanager/i });
            const employee = await User.findOne({ email: /vhintu/i });

            if (manager) {
                console.log('✅ Manager Found:');
                console.log(`   Name: ${manager.firstName} ${manager.lastName}`);
                console.log(`   Email: ${manager.email}`);
                console.log(`   ID: ${manager._id}\n`);
            } else {
                console.log('❌ Manager with "atikmanager" not found');
                console.log('   Available emails:', users.map(u => u.email).join(', '));
                console.log('');
            }

            if (employee) {
                console.log('✅ Employee Found:');
                console.log(`   Name: ${employee.firstName} ${employee.lastName}`);
                console.log(`   Email: ${employee.email}`);
                console.log(`   ID: ${employee._id}`);
                console.log(`   Reporting Manager: ${employee.reportingManager || 'NOT SET ❌'}\n`);

                if (manager && employee.reportingManager !== manager._id) {
                    console.log('⚠️  RELATIONSHIP ISSUE DETECTED!');
                    console.log(`   Employee's reportingManager: ${employee.reportingManager}`);
                    console.log(`   Manager's actual ID: ${manager._id}`);
                    console.log('\n   🔧 FIX: Run the auto-fix script to correct this\n');
                }
            } else {
                console.log('❌ Employee with "vhintu" not found');
                console.log('   Available emails:', users.map(u => u.email).join(', '));
                console.log('');
            }
        }

        // Check leave requests
        console.log('═══════════════════════════════════════');
        console.log('📋 LEAVE REQUEST VERIFICATION');
        console.log('═══════════════════════════════════════\n');

        const totalLeaves = await LeaveRequest.countDocuments();
        console.log(`Total leave requests: ${totalLeaves}\n`);

        if (totalLeaves > 0) {
            const leaves = await LeaveRequest.find({})
                .populate('userId', 'firstName lastName email')
                .select('userId managerId leaveType status createdAt');

            leaves.forEach((leave, index) => {
                console.log(`${index + 1}. Leave Request:`);
                console.log(`   Employee: ${leave.userId?.firstName} ${leave.userId?.lastName} (${leave.userId?.email})`);
                console.log(`   Employee ID: ${leave.userId?._id}`);
                console.log(`   Manager ID: ${leave.managerId || '❌ NOT SET'}`);
                console.log(`   Type: ${leave.leaveType}`);
                console.log(`   Status: ${leave.status}`);
                console.log(`   Created: ${leave.createdAt}`);
                console.log('');
            });

            // Check for issues
            const leavesWithoutManager = await LeaveRequest.countDocuments({ managerId: { $exists: false } });
            const leavesWithNullManager = await LeaveRequest.countDocuments({ managerId: null });

            if (leavesWithoutManager > 0 || leavesWithNullManager > 0) {
                console.log(`⚠️  WARNING: ${leavesWithoutManager + leavesWithNullManager} leave requests missing manager ID!`);
                console.log('   This is why notifications aren\'t showing.\n');
            }
        }

        console.log('═══════════════════════════════════════');
        console.log('✅ VERIFICATION COMPLETE');
        console.log('═══════════════════════════════════════\n');

        if (totalUsers === 0) {
            console.log('🚨 ACTION REQUIRED:');
            console.log('   1. Check MongoDB Compass for all databases');
            console.log('   2. Find the database with your actual user data');
            console.log('   3. Update MONGODB_URI in .env or server.js\n');
        }

    } catch (error) {
        console.error('❌ Error during verification:', error);
    } finally {
        mongoose.connection.close();
        console.log('📡 Database connection closed\n');
    }
}

verifyDatabase();
