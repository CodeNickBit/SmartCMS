/**
 * Fix April 2026 attendance for manush@gmail.com:
 * - Delete weekend records (Apr 4, 5, 11, 12)
 * - Redistribute: exactly 3 late days, 2 overtime days on weekdays
 * - Apr 11 absent/declined stays but moves to a weekday (Apr 11 is Sat → use Apr 13 Mon instead, but Apr 13 already late)
 *   Actually Apr 11 absent should be on a weekday. We'll use Apr 14 (Tue) which is currently half-day.
 *   Plan:
 *     Late: Apr 13 (Mon), Apr 16 (Thu), Apr 17 (Fri)
 *     Overtime: Apr 15 (Wed, 11h already), Apr 22 (Wed, set to 10h)
 *     Absent/declined: Apr 14 (Tue) — update existing half-day record
 */

require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const Attendance = require('./models/Attendance');
const Manager = require('./models/Manager');
const User = require('./models/User');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected');

  const employee = await User.findOne({ email: 'manush@gmail.com' });
  const manager = await Manager.findOne({ email: 'atikmanager@gmail.com' });
  const managerId = manager._id.toString();
  const empId = employee._id;

  // 1. Delete weekend records: Apr 4 (Sat), Apr 5 (Sun), Apr 11 (Sat), Apr 12 (Sun)
  const weekendDates = [
    new Date('2026-04-04T00:00:00.000Z'),
    new Date('2026-04-05T00:00:00.000Z'),
    new Date('2026-04-11T00:00:00.000Z'),
    new Date('2026-04-12T00:00:00.000Z'),
  ];
  for (const d of weekendDates) {
    const res = await Attendance.deleteOne({ employeeId: empId, date: d });
    console.log(`Deleted ${d.toISOString().slice(0,10)}: ${res.deletedCount} record(s)`);
  }

  // 2. Update Apr 14 (Tue) — currently half-day → absent/declined
  await Attendance.findOneAndUpdate(
    { employeeId: empId, date: new Date('2026-04-14T00:00:00.000Z') },
    {
      status: 'absent',
      approvalStatus: 'declined',
      workingHours: 0,
      checkIn: undefined,
      checkOut: undefined,
      managerNotes: 'Absent without notice',
      approvedBy: managerId,
      approvedAt: new Date(),
    }
  );
  console.log('Updated Apr 14 → absent/declined');

  // 3. Set late days: Apr 13 (Mon), Apr 16 (Thu), Apr 17 (Fri) — 7h each
  const lateDates = [
    new Date('2026-04-13T00:00:00.000Z'),
    new Date('2026-04-16T00:00:00.000Z'),
    new Date('2026-04-17T00:00:00.000Z'),
  ];
  for (const d of lateDates) {
    const day = d.getUTCDate();
    const checkInTime = new Date(d.getTime() + 10 * 3600 * 1000);
    const checkOutTime = new Date(d.getTime() + 17 * 3600 * 1000);
    await Attendance.findOneAndUpdate(
      { employeeId: empId, date: d },
      {
        status: 'late',
        approvalStatus: 'approved',
        workingHours: 7.0,
        checkIn: { time: checkInTime, location: { latitude: 23.0225, longitude: 72.5714 }, address: 'Office', distance: 0 },
        checkOut: { time: checkOutTime, location: { latitude: 23.0225, longitude: 72.5714 }, address: 'Office' },
        approvedBy: managerId,
        approvedAt: new Date(),
        managerNotes: undefined,
      },
      { upsert: true, new: true }
    );
    console.log(`Set Apr ${day} → late/approved/7h`);
  }

  // 4. Set overtime days: Apr 15 (Wed, already 11h) and Apr 22 (Wed, set to 10h)
  await Attendance.findOneAndUpdate(
    { employeeId: empId, date: new Date('2026-04-15T00:00:00.000Z') },
    { status: 'present', approvalStatus: 'approved', workingHours: 11.0 }
  );
  console.log('Confirmed Apr 15 → present/approved/11h (overtime)');

  await Attendance.findOneAndUpdate(
    { employeeId: empId, date: new Date('2026-04-22T00:00:00.000Z') },
    {
      status: 'present',
      approvalStatus: 'approved',
      workingHours: 10.0,
      checkIn: { time: new Date('2026-04-22T03:30:00.000Z'), location: { latitude: 23.0225, longitude: 72.5714 }, address: 'Office', distance: 0 },
      checkOut: { time: new Date('2026-04-22T13:30:00.000Z'), location: { latitude: 23.0225, longitude: 72.5714 }, address: 'Office' },
      approvedBy: managerId,
      approvedAt: new Date(),
    }
  );
  console.log('Set Apr 22 → present/approved/10h (overtime)');

  // 5. Ensure all remaining weekday records are present/approved/8h (fix Apr 16, 17 already done above)
  // Apr 6 (Mon) through Apr 10 (Fri) — already correct
  // Verify final state
  console.log('\n--- Final April attendance ---');
  const recs = await Attendance.find({
    employeeId: empId,
    date: { $gte: new Date('2026-04-01'), $lte: new Date('2026-04-30') }
  }).select('date status approvalStatus workingHours').sort({ date: 1 });

  recs.forEach(r => {
    const d = new Date(r.date);
    const dow = d.getUTCDay();
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const isWE = dow === 0 || dow === 6;
    console.log(d.toISOString().slice(0,10), days[dow], isWE ? '⚠ WEEKEND' : '         ', r.status.padEnd(8), r.approvalStatus.padEnd(8), r.workingHours + 'h');
  });

  await mongoose.disconnect();
  console.log('\nDone.');
}

run().catch(err => { console.error(err); process.exit(1); });
