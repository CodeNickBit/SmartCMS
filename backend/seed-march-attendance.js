/**
 * Seed March 2026 attendance for Atik's team:
 * - manush@gmail.com
 * - chintu@gmail.com
 * - subham@gmail.com
 * 
 * March 2026: 31 days, 23 working days (Mon-Fri)
 * Each employee gets a realistic mix of present/late/overtime/absent
 */

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
  console.log('Connected to MongoDB\n');

  const manush = await User.findOne({ email: 'manush@gmail.com' });
  const chintu = await User.findOne({ email: 'chintu@gmail.com' });
  const subham = await User.findOne({ email: 'subham@gmail.com' });
  const manager = await Manager.findOne({ email: 'atikmanager@gmail.com' });
  const mid = manager._id;

  console.log('Employees:');
  console.log('  Manush:', manush._id);
  console.log('  Chintu:', chintu._id);
  console.log('  Subham:', subham._id);
  console.log('Manager:', manager.name, mid);
  console.log();

  // --- Manush: 3 late, 2 overtime, 1 absent ---
  const manushPlan = new Map([
    ['2026-03-05', { status: 'late',    approval: 'approved', wh: 7.0,  ci: 10,   co: 17 }],
    ['2026-03-11', { status: 'absent',  approval: 'declined', wh: 0,    ci: null, co: null }],
    ['2026-03-13', { status: 'late',    approval: 'approved', wh: 7.0,  ci: 10,   co: 17 }],
    ['2026-03-18', { status: 'present', approval: 'approved', wh: 10.0, ci: 9,    co: 19 }],
    ['2026-03-24', { status: 'late',    approval: 'approved', wh: 7.0,  ci: 10,   co: 17 }],
    ['2026-03-27', { status: 'present', approval: 'approved', wh: 11.0, ci: 9,    co: 20 }],
  ]);

  // --- Chintu: 2 late, 2 overtime, 2 absent ---
  const chintuPlan = new Map([
    ['2026-03-03', { status: 'absent',  approval: 'declined', wh: 0,    ci: null, co: null }],
    ['2026-03-10', { status: 'late',    approval: 'approved', wh: 7.0,  ci: 10,   co: 17 }],
    ['2026-03-12', { status: 'present', approval: 'approved', wh: 9.5,  ci: 9,    co: 18.5 }],
    ['2026-03-17', { status: 'late',    approval: 'approved', wh: 7.0,  ci: 10,   co: 17 }],
    ['2026-03-20', { status: 'absent',  approval: 'declined', wh: 0,    ci: null, co: null }],
    ['2026-03-26', { status: 'present', approval: 'approved', wh: 10.0, ci: 9,    co: 19 }],
  ]);

  // --- Subham: 3 late, 1 overtime, 1 absent ---
  const subhamPlan = new Map([
    ['2026-03-04', { status: 'late',    approval: 'approved', wh: 7.0,  ci: 10,   co: 17 }],
    ['2026-03-06', { status: 'absent',  approval: 'declined', wh: 0,    ci: null, co: null }],
    ['2026-03-16', { status: 'late',    approval: 'approved', wh: 7.0,  ci: 10,   co: 17 }],
    ['2026-03-23', { status: 'late',    approval: 'approved', wh: 7.0,  ci: 10,   co: 17 }],
    ['2026-03-31', { status: 'present', approval: 'approved', wh: 10.5, ci: 9,    co: 19.5 }],
  ]);

  const employees = [
    { name: 'Manush', id: manush._id, plan: manushPlan },
    { name: 'Chintu', id: chintu._id, plan: chintuPlan },
    { name: 'Subham', id: subham._id, plan: subhamPlan },
  ];

  for (const emp of employees) {
    console.log(`\n=== ${emp.name} ===`);
    let inserted = 0, updated = 0;

    for (let day = 1; day <= 31; day++) {
      const dateStr = `2026-03-${String(day).padStart(2, '0')}`;
      const date = new Date(dateStr + 'T00:00:00.000Z');
      if (isWeekend(date)) continue;

      const plan = emp.plan.get(dateStr) ?? { status: 'present', approval: 'approved', wh: 8.0, ci: 9, co: 17 };
      const rec = makeRecord(emp.id, mid, dateStr, plan.status, plan.approval, plan.wh, plan.ci, plan.co);
      const res = await upsert(rec);
      console.log(`  ${dateStr} → ${plan.status.padEnd(7)} / ${plan.approval.padEnd(8)} / ${plan.wh}h [${res}]`);
      res === 'inserted' ? inserted++ : updated++;
    }

    console.log(`  Total: inserted ${inserted}, updated ${updated}`);
  }

  console.log('\n✅ March 2026 attendance seeded for all 3 employees');
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
