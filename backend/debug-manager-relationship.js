const mongoose = require('mongoose');
const User = require('./models/User');
const LeaveRequest = require('./models/LeaveRequest');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/smartcms', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function debugManagerEmployeeRelationship() {
    try {
        console.log('\n=== DEBUGGING MANAGER-EMPLOYEE RELATIONSHIP ===\n');

        // Find the employee
        const employee = await User.findOne({ email: 'vhintu@gmail.com' });
        if (!employee) {
            console.log('❌ Employee vhintu@gmail.com not found');
            return;
        }

        console.log('✅ Employee Found:');
        console.log(`   ID: ${employee._id}`);
        console.log(`   Name: ${employee.firstName} ${employee.lastName}`);
        console.log(`   Email: ${employee.email}`);
        console.log(`   Reporting Manager ID: ${employee.reportingManager || 'NOT SET'}`);

        // Find the manager
        const manager = await User.findOne({ email: 'atikmanager@gmail.com' });
        if (!manager) {
            console.log('\n❌ Manager atikmanager@gmail.com not found');
            return;
        }

        console.log('\n✅ Manager Found:');
        console.log(`   ID: ${manager._id}`);
        console.log(`   Name: ${manager.firstName} ${manager.lastName}`);
        console.log(`   Email: ${manager.email}`);

        // Check if they're connected
        console.log('\n📊 Relationship Status:');
        if (employee.reportingManager === manager._id) {
            console.log('   ✅ Employee correctly reports to this manager');
        } else {
            console.log('   ❌ MISMATCH!');
            console.log(`   Employee's reportingManager: ${employee.reportingManager}`);
            console.log(`   Manager's ID: ${manager._id}`);
            console.log('\n   🔧 FIX NEEDED: Update employee.reportingManager to match manager._id');
        }

        // Check leave requests
        console.log('\n📋 Leave Requests:');
        const leaveRequests = await LeaveRequest.find({ userId: employee._id });
        console.log(`   Total leave requests by employee: ${leaveRequests.length}`);

        if (leaveRequests.length > 0) {
            leaveRequests.forEach((req, index) => {
                console.log(`\n   Request #${index + 1}:`);
                console.log(`      ID: ${req._id}`);
                console.log(`      Type: ${req.leaveType}`);
                console.log(`      Status: ${req.status}`);
                console.log(`      Manager ID in request: ${req.managerId || 'NOT SET'}`);
                console.log(`      Expected Manager ID: ${manager._id}`);
                console.log(`      Match: ${req.managerId === manager._id ? '✅' : '❌'}`);
            });
        }

        // Check what manager would see
        console.log('\n🔍 What Manager Sees:');
        const managerLeaves = await LeaveRequest.find({ managerId: manager._id });
        console.log(`   Leave requests assigned to manager: ${managerLeaves.length}`);

        if (managerLeaves.length === 0) {
            console.log('   ❌ No leave requests found for this manager!');
            console.log('   This is why notifications aren\'t showing.');
        }

        console.log('\n=== END DEBUG ===\n');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.connection.close();
    }
}

debugManagerEmployeeRelationship();
