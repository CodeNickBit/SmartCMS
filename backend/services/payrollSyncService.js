/**
 * PayrollSyncService
 *
 * Phase 2: Pay Cycle & LOP Engine
 * 
 * Bridges the Attendance module with the Payroll Calculation Engine.
 * For a given employee and pay period, it computes:
 *   - Total working days in the period
 *   - Days absent without approval (potential LOP)
 *   - Late marks above threshold (potential LOP)
 *   - Paid days (after LOP deduction, if LOP rules are enabled)
 *   - Overtime hours worked (if OT rules are enabled)
 */

const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const CompanySettings = require('../models/CompanySettings');

/**
 * Returns the number of working days in a given date range, excluding weekends (Sat/Sun).
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {number}
 */
function getWorkingDaysInRange(startDate, endDate) {
    let count = 0;
    const cursor = new Date(startDate);
    cursor.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    while (cursor <= end) {
        const dayOfWeek = cursor.getDay(); // 0 = Sun, 6 = Sat
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            count++;
        }
        cursor.setDate(cursor.getDate() + 1);
    }
    return count;
}

/**
 * Computes the pay period dates from CompanySettings.
 * @param {number} year
 * @param {number} month - 1-indexed
 * @param {object} payrollSettings
 * @returns {{ startDate: Date, endDate: Date }}
 */
function computePayPeriod(year, month, payrollSettings) {
    const startDay = payrollSettings?.payPeriodStartDay || 1;

    const startDate = new Date(year, month - 1, startDay);
    // End date is one day before the same day next month
    const endDate = new Date(year, month, startDay - 1);

    return { startDate, endDate };
}

/**
 * Main entry point. Calculates the payroll sync data for a single employee
 * for a given month/year based on configured LOP and OT rules.
 * 
 * @param {string} employeeId
 * @param {number} year
 * @param {number} month - 1-indexed (1=Jan, ..., 12=Dec)
 * @returns {Promise<{
 *   startDate: Date,
 *   endDate: Date,
 *   totalWorkingDays: number,
 *   lopDays: number,
 *   paidDays: number,
 *   overtimeHours: number,
 *   presenceSummary: object
 * }>}
 */
async function computePayrollSync(employeeId, year, month) {
    const settings = await CompanySettings.findOne().sort({ createdAt: -1 }).lean();
    const payrollSettings = settings?.payrollSettings || {};
    const lopRules = payrollSettings.lopRules || {};
    const otRules = payrollSettings.overtimeRules || {};

    const { startDate, endDate } = computePayPeriod(year, month, payrollSettings);
    const totalWorkingDays = getWorkingDaysInRange(startDate, endDate);

    // --- Fetch all attendance records for the employee in this period ---
    const attendanceRecords = await Attendance.find({
        employeeId,
        date: { $gte: startDate, $lte: endDate }
    }).lean();

    const summary = {
        present: 0,
        absent: 0,
        late: 0,
        halfDay: 0,
        onLeave: 0,
        unapprovedAbsent: 0,
        totalOvertimeHours: 0
    };

    for (const rec of attendanceRecords) {
        switch (rec.status) {
            case 'present':   summary.present++; break;
            case 'absent':    summary.absent++;   break;
            case 'late':      summary.late++;     break;
            case 'half-day':  summary.halfDay++;  break;
            case 'on_leave':  summary.onLeave++;  break;
        }

        // Track unapproved absences separately
        if (rec.status === 'absent' && rec.approvalStatus !== 'approved') {
            summary.unapprovedAbsent++;
        }

        // Calculate overtime hours if OT is enabled
        if (otRules.enabled && rec.workingHours > 0) {
            const standardHours = otRules.standardWorkHoursPerDay || 8;
            const excessHours = rec.workingHours - standardHours;
            if (excessHours > 0) {
                summary.totalOvertimeHours += excessHours;
            }
        }
    }

    // --- Compute LOP days ---
    let lopDays = 0;

    if (lopRules.enabled) {
        // Rule 1: 'Absent' status counts as LOP (they didn't arrive for work/no leave permission)
        lopDays += summary.absent;

        // Rule 2: Late marks meeting or exceeding threshold count as LOP
        if (lopRules.considerLateMarksAsLOP) {
            const threshold = lopRules.lateMarksThreshold || 3;
            if (summary.late >= threshold) {
                // Each group of (threshold) late marks = 1 LOP day
                lopDays += Math.floor(summary.late / threshold);
            }
        }
    }

    // Half-days count as 0.5 LOP days
    const halfDayLop = summary.halfDay * 0.5;
    lopDays = Math.min(lopDays + halfDayLop, totalWorkingDays);

    const paidDays = Math.max(0, totalWorkingDays - lopDays);

    return {
        startDate,
        endDate,
        totalWorkingDays,
        lopDays,
        paidDays,
        overtimeHours: summary.totalOvertimeHours,
        presenceSummary: summary
    };
}

module.exports = { computePayrollSync, computePayPeriod, getWorkingDaysInRange };
