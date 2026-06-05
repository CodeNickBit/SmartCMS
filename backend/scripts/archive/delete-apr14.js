require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const Attendance = require('./models/Attendance');
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const res = await Attendance.deleteOne({ employeeId: '26013189505', date: new Date('2026-04-14T00:00:00.000Z') });
  console.log('Deleted Apr 14:', res.deletedCount, 'record(s)');
  await mongoose.disconnect();
});
