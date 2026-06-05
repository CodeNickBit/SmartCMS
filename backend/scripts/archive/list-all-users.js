const mongoose = require('mongoose');
const User = require('./models/User');
const LeaveRequest = require('./models/LeaveRequest');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/smartcms', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function listAllUsers() {
    try {
        console.log('\n=== ALL USERS IN DATABASE ===\n');

        const users = await User.find({}).select('_id firstName lastName email role reportingManager');

        console.log(`Total users: ${users.length}\n`);

        users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
            console.log(`   ID: ${user._id}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Reporting Manager: ${user.reportingManager || 'None'}`);
            console.log('');
        });

        // Find users with 'atik' or 'vhintu' in email
        console.log('\n=== SEARCHING FOR SPECIFIC USERS ===\n');

        const atikUsers = await User.find({ email: /atik/i });
        console.log(`Users with 'atik' in email: ${atikUsers.length}`);
        atikUsers.forEach(u => console.log(`   - ${u.email} (${u.firstName} ${u.lastName})`));

        const vhintuUsers = await User.find({ email: /vhintu/i });
        console.log(`\nUsers with 'vhintu' in email: ${vhintuUsers.length}`);
        vhintuUsers.forEach(u => console.log(`   - ${u.email} (${u.firstName} ${u.lastName})`));

        // Check leave requests
        console.log('\n=== ALL LEAVE REQUESTS ===\n');
        const leaves = await LeaveRequest.find({}).select('userId managerId leaveType status createdAt');
        console.log(`Total leave requests: ${leaves.length}\n`);

        leaves.forEach((leave, index) => {
            console.log(`${index + 1}. Leave Request:`);
            console.log(`   ID: ${leave._id}`);
            console.log(`   Employee ID: ${leave.userId}`);
            console.log(`   Manager ID: ${leave.managerId || 'NOT SET'}`);
            console.log(`   Type: ${leave.leaveType}`);
            console.log(`   Status: ${leave.status}`);
            console.log(`   Created: ${leave.createdAt}`);
            console.log('');
        });

        console.log('\n=== END ===\n');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.connection.close();
    }
}

listAllUsers();
