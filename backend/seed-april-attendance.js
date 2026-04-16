/**
 * Seed script: Insert April 2026 attendance for manush@gmail.com
 * approved by atikmanager@gmail.com
 *
 * Run: node backend/seed-april-attendance.js
 */

require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const Attendance = require('./models/Attendance');
const User = require('./models/User');
const Manager = require('./models/Manager');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const employee = await User.findOne({ email: 'manush@gmail.com' });
  if (!employee) { console.error('Employee manush@gmail.com not found'); process.exit(1); }

  const manager = await Manager.findOne({ email: 'atikmanager@gmail.com' });
  if (!manager) { console.error('Manager atikmanager@gmail.com not found'); process.exit(1); }

  console.log(`Employee: ${employee.firstName} ${employee.lastName} (${employee._id})`);
  console.log(`Manager:  ${manager.name} (${manager._id})`);

  const managerId = manager._id.toString();

  const records = [
    // Apr 1-10: present, approved, 8.0h
    ...Array.from({ length: 10 }, (_, i) => ({
      date: new Date(`2026-04-${String(i + 1).padStart(2, '0')}T00:00:00.000Z`),
      status: 'present',
      approvalStatus: 'approved',
      workingHours: 8.0,
      checkInHour: 9, checkOutHour: 17
    })),
    // Apr 11: absent, declined, 0h
    {
      date: new Date('2026-04-11T00:00:00.000Z'),
      status: 'absent',
      approvalStatus: 'declined',
      workingHours: 0,
      checkInHour: null, checkOutHour: null
    },
    // Apr 12-14: late, approved, 7.0h
    ...Array.from({ length: 3 }, (_, i) => ({
      date: new Date(`2026-04-${String(i + 12).padStart(2, '0')}T00:00:00.000Z`),
      status: 'late',
      approvalStatus: 'approved',
      workingHours: 7.0,
      checkInHour: 10, checkOutHour: 17
    })),
    // Apr 15: present, approved, 11.0h (3h overtime)
    {
      date: new Date('2026-04-15T00:00:00.000Z'),
      status: 'present',
      approvalStatus: 'approved',
      workingHours: 11.0,
      checkInHour: 9, checkOutHour: 20
    },
    // Apr 16-30: present, approved, 8.0h (skip weekends: Apr 18-19, 25-26)
    ...Array.from({ length: 15 }, (_, i) => {
      const day = i + 16;
      const d = new Date(`2026-04-${String(day).padStart(2, '0')}T00:00:00.000Z`);
      const dow = d.getDay();
      if (dow === 0 || dow === 6) return null;
      return {
        date: d,
        status: 'present',
        approvalStatus: 'approved',
        workingHours: 8.0,
        checkInHour: 9, checkOutHour: 17
      };
    }).filter(Boolean)
  ];

  let inserted = 0, skipped = 0;

  for (const rec of records) {
    const existing = await Attendance.findOne({ employeeId: employee._id, date: rec.date });
    if (existing) {
      console.log(`  SKIP  ${rec.date.toISOString().slice(0, 10)} (already exists)`);
      skipped++;
      continue;
    }

    const checkInTime = rec.checkInHour !== null
      ? new Date(rec.date.getTime() + rec.checkInHour * 3600 * 1000)
      : null;
    const checkOutTime = rec.checkOutHour !== null
      ? new Date(rec.date.getTime() + rec.checkOutHour * 3600 * 1000)
      : null;

    const doc = new Attendance({
      employeeId: employee._id,
      date: rec.date,
      status: rec.status,
      approvalStatus: rec.approvalStatus,
      workingHours: rec.workingHours,
      assignedManagerId: manager._id,
      approvedBy: managerId,
      approvedAt: new Date(),
      managerNotes: rec.approvalStatus === 'declined' ? 'Absent without notice' : undefined,
      checkIn: checkInTime ? {
        time: checkInTime,
        location: { latitude: 23.0225, longitude: 72.5714 },
        address: 'Office',
        distance: 0
      } : undefined,
      checkOut: checkOutTime ? {
        time: checkOutTime,
        location: { latitude: 23.0225, longitude: 72.5714 },
        address: 'Office'
      } : undefined,
      auditLog: [
        {
          actorId: employee._id,
          actorRole: 'employee',
          action: 'created',
          newStatus: rec.status,
          newApprovalStatus: 'pending'
        },
        {
          actorId: managerId,
          actorRole: 'manager',
          action: rec.approvalStatus === 'declined' ? 'declined' : 'approved',
          previousStatus: rec.status,
          previousApprovalStatus: 'pending',
          newStatus: rec.status,
          newApprovalStatus: rec.approvalStatus,
          notes: rec.approvalStatus === 'declined' ? 'Absent without notice' : undefined
        }
      ]
    });

    await doc.save();
    console.log(`  INSERT ${rec.date.toISOString().slice(0, 10)} | ${rec.status.padEnd(7)} | ${rec.approvalStatus.padEnd(8)} | ${rec.workingHours}h`);
    inserted++;
  }

  console.log(`\nDone. Inserted: ${inserted}, Skipped: ${skipped}`);
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
