require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const Attendance = require('./models/Attendance');
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const recs = await Attendance.find({
    employeeId: '26013189505',
    date: { $gte: new Date('2026-04-01'), $lte: new Date('2026-04-30') }
  }).select('date status approvalStatus workingHours').sort({ date: 1 });
  recs.forEach(r => {
    const d = new Date(r.date);
    const dow = d.getUTCDay();
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const isWE = dow === 0 || dow === 6;
    console.log(d.toISOString().slice(0,10), days[dow], isWE ? 'WEEKEND' : '       ', r.status, r.approvalStatus, r.workingHours + 'h', r._id);
  });
  await mongoose.disconnect();
});
