require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Manager = require('./models/Manager');
const Attendance = require('./models/Attendance');

async function debugAttendance() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('=== MANAGERS ===');
    const managers = await Manager.find({}).select('_id name email');
    managers.forEach(m => {
      console.log(`ID: ${m._id} | Name: ${m.name} | Email: ${m.email}`);
    });

    console.log('\n=== EMPLOYEES ===');
    const employees = await User.find({}).select('_id firstName lastName email reportingManager');
    employees.forEach(e => {
      console.log(`ID: ${e._id} | Name: ${e.firstName} ${e.lastName} | Reporting To: ${e.reportingManager || 'NONE'}`);
    });

    console.log('\n=== PENDING ATTENDANCE ===');
    const pending = await Attendance.find({ approvalStatus: 'pending' })
      .populate('employeeId', 'firstName lastName reportingManager');
    
    if (pending.length === 0) {
      console.log('No pending attendance records found');
    } else {
      pending.forEach(a => {
        console.log(`Employee: ${a.employeeId?.firstName} ${a.employeeId?.lastName} (${a.employeeId?._id})`);
        console.log(`  Reports To: ${a.employeeId?.reportingManager || 'NONE'}`);
        console.log(`  Check-in: ${a.checkIn.time}`);
        console.log(`  Status: ${a.approvalStatus}\n`);
      });
    }

    console.log('\n=== DIAGNOSIS ===');
    if (managers.length === 0) {
      console.log('❌ No managers found in database');
    }
    if (employees.length === 0) {
      console.log('❌ No employees found in database');
    }
    if (pending.length === 0) {
      console.log('⚠️  No pending attendance records');
    }

    const employeesWithoutManager = employees.filter(e => !e.reportingManager);
    if (employeesWithoutManager.length > 0) {
      console.log(`⚠️  ${employeesWithoutManager.length} employees have no reporting manager set`);
      employeesWithoutManager.forEach(e => {
        console.log(`   - ${e.firstName} ${e.lastName} (${e._id})`);
      });
    }

    console.log('\n=== RECOMMENDATIONS ===');
    if (employeesWithoutManager.length > 0) {
      console.log('1. Set reportingManager field for employees to match manager name or email');
      console.log('   Example: Update employee reportingManager to match manager name exactly');
    }
    if (pending.length > 0 && managers.length > 0) {
      console.log('2. Verify reportingManager values match manager names/emails/IDs');
      console.log('   Current manager names:', managers.map(m => m.name).join(', '));
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugAttendance();
