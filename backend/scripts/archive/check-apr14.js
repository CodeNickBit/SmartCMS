require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const Attendance = require('./models/Attendance');
const LeaveRequest = require('./models/LeaveRequest');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const emp = await User.findOne({ email: 'manush@gmail.com' });
  console.log('Employee ID:', emp._id);

  const att = await Attendance.findOne({ employeeId: emp._id, date: new Date('2026-04-14T00:00:00.000Z') });
  console.log('Apr 14 attendance:', att ? `${att.status} / ${att.approvalStatus}` : 'none');

  const leaves = await LeaveRequest.find({ userId: emp._id.toString() }).sort({ startDate: 1 });
  console.log('Leave requests:', leaves.length);
  leaves.forEach(l => console.log(' ', l.startDate.toISOString().slice(0,10), '-', l.endDate.toISOString().slice(0,10), l.leaveType, l.status));

  await mongoose.disconnect();
});
