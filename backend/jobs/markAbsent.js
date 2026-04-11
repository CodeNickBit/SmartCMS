const Attendance = require('../models/Attendance');
const User = require('../models/User');
const OfficeLocation = require('../models/OfficeLocation');
const LeaveRequest = require('../models/LeaveRequest');

function getDateInTimezone(timezone) {
  const now = new Date();
  const localStr = now.toLocaleDateString('en-CA', { timeZone: timezone });
  return new Date(localStr + 'T00:00:00.000Z');
}

async function markAbsentEmployees() {
  try {
    const location = await OfficeLocation.findOne({ isActive: true });
    const timezone = location?.timezone || 'Asia/Kolkata';
    const today = getDateInTimezone(timezone);

    const activeEmployees = await User.find({ active_inactive: true, role: 'employee' }).select('_id');

    for (const emp of activeEmployees) {
      const empId = emp._id.toString();

      const existing = await Attendance.findOne({ employeeId: empId, date: today });
      if (existing) continue;

      const onLeave = await LeaveRequest.findOne({
        userId: empId,
        status: 'Approved',
        startDate: { $lte: today },
        endDate: { $gte: today }
      });

      if (onLeave) {
        await Attendance.create({
          employeeId: empId,
          date: today,
          status: 'on_leave',
          approvalStatus: 'auto_closed',
          auditLog: [{
            actorId: 'system',
            actorRole: 'system',
            action: 'auto_absent',
            newStatus: 'on_leave',
            newApprovalStatus: 'auto_closed',
            notes: `Auto-marked on_leave. Leave ID: ${onLeave._id}`
          }]
        });
      } else {
        await Attendance.create({
          employeeId: empId,
          date: today,
          status: 'absent',
          approvalStatus: 'auto_closed',
          auditLog: [{
            actorId: 'system',
            actorRole: 'system',
            action: 'auto_absent',
            newStatus: 'absent',
            newApprovalStatus: 'auto_closed',
            notes: 'Auto-marked absent by end-of-day job'
          }]
        });
      }
    }

    console.log(`[markAbsent] Completed for ${today.toISOString().split('T')[0]}`);
  } catch (err) {
    console.error('[markAbsent] Error:', err.message);
  }
}

module.exports = markAbsentEmployees;
