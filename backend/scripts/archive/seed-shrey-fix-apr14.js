require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const Attendance = require('./models/Attendance');
const User = require('./models/User');
const Manager = require('./models/Manager');

function isWeekend(date) {
  const d = date.getUTCDay();
  return d === 0 || d === 6;
}

function makeRecord(empId, managerId, dateStr, status, approvalStatus, workingHours, checkInHour, checkOutHour) {
  const date = new Date(dateStr + 'T00:00:00.000Z');
  const checkIn = checkInHour != null ? {
    time: new Date(date.getTime() + checkInHour * 3600000),
    location: { latitude: 23.0225, longitude: 72.5714 },
    address: 'Office', distance: 0
  } : undefined;
  const checkOut = checkOutHour != null ? {
    time: new Date(date.getTime() + checkOutHour * 3600000),
    location: { latitude: 23.0225, longitude: 72.5714 },
    address: 'Office'
  } : undefined;
  return {
    employeeId: empId, date, status, approvalStatus, workingHours,
    assignedManagerId: managerId, approvedBy: managerId.toString(),
    approvedAt: new Date(),
    managerNotes: approvalStatus === 'declined' ? 'Absent without notice' : undefined,
    checkIn, checkOut,
    auditLog: [
      { actorId: empId, actorRole: 'employee', action: 'created', newStatus: status, newApprovalStatus: 'pending' },
      { actorId: managerId.toString(), actorRole: 'manager',
        action: approvalStatus === 'declined' ? 'declined' : 'approved',
        previousStatus: status, previousApprovalStatus: 'pending',
        newStatus: status, newApprovalStatus: approvalStatus }
    ]
  };
}

async function upsert(rec) {
  const existing = await Attendance.findOne({ employeeId: rec.employeeId, date: rec.date });
  if (existing) {
    await Attendance.updateOne({ _id: existing._id }, rec);
    return 'updated';
  }
  await new Attendance(rec).save();
  return 'inserted';
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected');

  const manush = await User.findOne({ email: 'manush@gmail.com' });
  const shrey  = await User.findOne({ email: 'shrey@gmail.com' });
  const manager = await Manager.findOne({ email: 'atikmanager@gmail.com' });
  const mid = manager._id;

  // --- Fix Manush Apr 14 (Tue) → absent/declined ---
  const apr14 = makeRecord(manush._id, mid, '2026-04-14', 'absent', 'declined', 0, null, null);
  const r = await upsert(apr14);
  console.log(`Manush Apr 14 → absent/declined [${r}]`);

  // --- Seed Shrey April 2026 ---
  // Plan: 22 working days in April (Mon-Fri, skip weekends)
  // 3 late (Apr 7 Tue, Apr 20 Mon, Apr 24 Fri)
  // 2 overtime (Apr 9 Thu 10h, Apr 28 Tue 11h)
  // 1 absent/declined (Apr 3 Fri)
  // rest: present/approved/8h

  const shreyPlan = new Map([
    ['2026-04-03', { status: 'absent',  approval: 'declined', wh: 0,    ci: null, co: null }],
    ['2026-04-07', { status: 'late',    approval: 'approved', wh: 7.0,  ci: 10,   co: 17 }],
    ['2026-04-09', { status: 'present', approval: 'approved', wh: 10.0, ci: 9,    co: 19 }],
    ['2026-04-20', { status: 'late',    approval: 'approved', wh: 7.0,  ci: 10,   co: 17 }],
    ['2026-04-24', { status: 'late',    approval: 'approved', wh: 7.0,  ci: 10,   co: 17 }],
    ['2026-04-28', { status: 'present', approval: 'approved', wh: 11.0, ci: 9,    co: 20 }],
  ]);

  let inserted = 0, updated = 0;
  for (let day = 1; day <= 30; day++) {
    const dateStr = `2026-04-${String(day).padStart(2, '0')}`;
    const date = new Date(dateStr + 'T00:00:00.000Z');
    if (isWeekend(date)) continue;

    const plan = shreyPlan.get(dateStr) ?? { status: 'present', approval: 'approved', wh: 8.0, ci: 9, co: 17 };
    const rec = makeRecord(shrey._id, mid, dateStr, plan.status, plan.approval, plan.wh, plan.ci, plan.co);
    const res = await upsert(rec);
    console.log(`Shrey ${dateStr} → ${plan.status}/${plan.approval}/${plan.wh}h [${res}]`);
    res === 'inserted' ? inserted++ : updated++;
  }

  console.log(`\nShrey: inserted ${inserted}, updated ${updated}`);
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
