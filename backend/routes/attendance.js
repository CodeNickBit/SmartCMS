const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const OfficeLocation = require('../models/OfficeLocation');
const User = require('../models/User');
const LeaveRequest = require('../models/LeaveRequest');
const { authenticateToken, isAdmin, isHR, isManager, isManagerOrHR } = require('../middleware/authMiddleware');

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const p1 = lat1 * Math.PI / 180;
  const p2 = lat2 * Math.PI / 180;
  const dp = (lat2 - lat1) * Math.PI / 180;
  const dl = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getDateInTimezone(timezone) {
  const now = new Date();
  const localStr = now.toLocaleDateString('en-CA', { timeZone: timezone });
  return new Date(localStr + 'T00:00:00.000Z');
}

function getTimeInTimezone(timezone) {
  return new Date(new Date().toLocaleString('en-US', { timeZone: timezone }));
}

async function getDirectReportIds(managerId) {
  const employees = await User.find({
    $or: [
      { reportingManager: managerId },
      { backupManager: managerId }
    ]
  }).select('_id');
  return employees.map(e => e._id.toString());
}

router.post('/check-in', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'employee') {
      return res.status(403).json({ message: 'Only employees can clock in' });
    }

    const { latitude, longitude, ipAddress, deviceFingerprint } = req.body;
    const employeeId = req.user._id || req.user.id;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: 'latitude and longitude are required' });
    }

    const activeLocations = await OfficeLocation.find({ isActive: true });
    if (!activeLocations.length) {
      return res.status(400).json({ message: 'No active office locations configured' });
    }

    let nearest = null;
    let minDistance = Infinity;
    for (const loc of activeLocations) {
      const d = haversineDistance(latitude, longitude, loc.latitude, loc.longitude);
      if (d < minDistance) { minDistance = d; nearest = loc; }
    }

    if (minDistance > nearest.radius) {
      return res.status(400).json({
        message: `You are ${Math.round(minDistance)}m away from ${nearest.name}. Must be within ${nearest.radius}m.`,
        distance: Math.round(minDistance),
        requiredRadius: nearest.radius
      });
    }

    const timezone = nearest.timezone || 'Asia/Kolkata';
    const today = getDateInTimezone(timezone);
    const nowLocal = getTimeInTimezone(timezone);

    const existing = await Attendance.findOne({ employeeId, date: today });
    if (existing?.checkIn?.time) {
      return res.status(400).json({ message: 'Already checked in today' });
    }

    const employee = await User.findById(employeeId).select('workingHoursStart workingHoursEnd');
    let status = 'present';

    if (employee?.workingHoursStart) {
      const [sh, sm] = employee.workingHoursStart.split(':').map(Number);
      const shiftStart = new Date(nowLocal);
      shiftStart.setHours(sh, sm, 0, 0);
      const gracePeriodMs = 15 * 60 * 1000;
      const halfShiftMs = employee.workingHoursEnd
        ? (() => {
            const [eh, em] = employee.workingHoursEnd.split(':').map(Number);
            const shiftEnd = new Date(nowLocal);
            shiftEnd.setHours(eh, em, 0, 0);
            return (shiftEnd - shiftStart) / 2;
          })()
        : 4 * 60 * 60 * 1000;

      if (nowLocal > new Date(shiftStart.getTime() + halfShiftMs)) {
        status = 'half-day';
      } else if (nowLocal > new Date(shiftStart.getTime() + gracePeriodMs)) {
        status = 'late';
      }
    }

    const attendance = new Attendance({
      employeeId,
      date: today,
      checkIn: {
        time: new Date(),
        location: { latitude, longitude },
        address: req.body.address || '',
        distance: Math.round(minDistance),
        officeLocation: nearest._id,
        ipAddress: ipAddress || req.ip,
        deviceFingerprint: deviceFingerprint || ''
      },
      status,
      approvalStatus: 'pending',
      auditLog: [{
        actorId: employeeId.toString(),
        actorRole: 'employee',
        action: 'created',
        newStatus: status,
        newApprovalStatus: 'pending'
      }]
    });

    await attendance.save();

    res.status(201).json({
      message: 'Check-in successful. Awaiting manager approval.',
      attendance,
      officeName: nearest.name,
      status
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/check-out', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'employee') {
      return res.status(403).json({ message: 'Only employees can clock out' });
    }

    const { latitude, longitude } = req.body;
    const employeeId = req.user._id || req.user.id;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: 'latitude and longitude are required' });
    }

    const activeLocations = await OfficeLocation.find({ isActive: true });
    let nearest = null;
    let minDistance = Infinity;
    for (const loc of activeLocations) {
      const d = haversineDistance(latitude, longitude, loc.latitude, loc.longitude);
      if (d < minDistance) { minDistance = d; nearest = loc; }
    }

    if (nearest && minDistance > nearest.radius) {
      return res.status(400).json({
        message: `You are ${Math.round(minDistance)}m away from ${nearest.name}. Must be within ${nearest.radius}m to check out.`,
        distance: Math.round(minDistance)
      });
    }

    const timezone = nearest?.timezone || 'Asia/Kolkata';
    const today = getDateInTimezone(timezone);

    const attendance = await Attendance.findOne({ employeeId, date: today });
    if (!attendance?.checkIn?.time) {
      return res.status(404).json({ message: 'No check-in record found for today' });
    }
    if (attendance.checkOut?.time) {
      return res.status(400).json({ message: 'Already checked out today' });
    }

    attendance.checkOut = {
      time: new Date(),
      location: { latitude, longitude },
      address: req.body.address || ''
    };

    const employee = await User.findById(employeeId).select('workingHoursStart workingHoursEnd');
    if (employee?.workingHoursStart && employee?.workingHoursEnd) {
      const nowLocal = getTimeInTimezone(timezone);
      const [sh, sm] = employee.workingHoursStart.split(':').map(Number);
      const [eh, em] = employee.workingHoursEnd.split(':').map(Number);
      const shiftStart = new Date(nowLocal); shiftStart.setHours(sh, sm, 0, 0);
      const shiftEnd = new Date(nowLocal); shiftEnd.setHours(eh, em, 0, 0);
      const shiftDurationMs = shiftEnd - shiftStart;
      const workedMs = new Date() - new Date(attendance.checkIn.time);
      if (workedMs < shiftDurationMs / 2 && attendance.status === 'present') {
        attendance.status = 'half-day';
      }
    }

    await attendance.save();

    res.json({
      message: 'Check-out successful',
      attendance,
      workingHours: attendance.workingHours
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/today', authenticateToken, async (req, res) => {
  try {
    const employeeId = req.user._id || req.user.id;
    const location = await OfficeLocation.findOne({ isActive: true });
    const timezone = location?.timezone || 'Asia/Kolkata';
    const today = getDateInTimezone(timezone);

    const attendance = await Attendance.findOne({ employeeId, date: today })
      .populate('checkIn.officeLocation', 'name');
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/my-attendance', authenticateToken, async (req, res) => {
  try {
    const employeeId = req.user._id || req.user.id;
    const { startDate, endDate, limit = 30 } = req.query;
    const query = { employeeId };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    const attendance = await Attendance.find(query)
      .populate('checkIn.officeLocation', 'name')
      .sort({ date: -1 })
      .limit(parseInt(limit));
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/pending-approvals', authenticateToken, isManagerOrHR, async (req, res) => {
  try {
    const { limit = 50, skip = 0 } = req.query;
    const query = { approvalStatus: 'pending' };

    if (req.user.role === 'manager') {
      const managerId = req.user._id || req.user.id;
      const reportIds = await getDirectReportIds(managerId);
      if (!reportIds.length) {
        return res.json({ attendance: [], total: 0, hasMore: false });
      }
      query.employeeId = { $in: reportIds };
    }

    const [pendingAttendance, total] = await Promise.all([
      Attendance.find(query)
        .populate('checkIn.officeLocation', 'name')
        .populate('employeeId', 'firstName lastName email employeeId department designation')
        .sort({ 'checkIn.time': -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip)),
      Attendance.countDocuments(query)
    ]);

    res.json({ attendance: pendingAttendance, total, hasMore: total > parseInt(skip) + parseInt(limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

async function canActOnAttendance(actorUser, attendance) {
  if (actorUser.role === 'admin') return true;
  if (actorUser.role === 'hr') return true;
  if (actorUser.role === 'manager') {
    const managerId = (actorUser._id || actorUser.id).toString();
    const reportIds = await getDirectReportIds(managerId);
    return reportIds.includes(attendance.employeeId.toString());
  }
  return false;
}

router.post('/approve/:attendanceId', authenticateToken, isManagerOrHR, async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.attendanceId);
    if (!attendance) return res.status(404).json({ message: 'Attendance record not found' });
    if (attendance.approvalStatus !== 'pending') {
      return res.status(400).json({ message: `Attendance already ${attendance.approvalStatus}` });
    }
    if (!await canActOnAttendance(req.user, attendance)) {
      return res.status(403).json({ message: 'You are not authorized to approve this record' });
    }

    const actorId = (req.user._id || req.user.id).toString();
    const prev = { status: attendance.status, approvalStatus: attendance.approvalStatus };

    attendance.approvalStatus = 'approved';
    attendance.approvedBy = actorId;
    attendance.approvedAt = new Date();
    if (req.body.notes) attendance.managerNotes = req.body.notes;
    attendance.auditLog.push({
      actorId, actorRole: req.user.role, action: 'approved',
      previousStatus: prev.status, previousApprovalStatus: prev.approvalStatus,
      newStatus: attendance.status, newApprovalStatus: 'approved',
      notes: req.body.notes
    });

    await attendance.save();
    res.json({ message: 'Attendance approved', attendance });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/decline/:attendanceId', authenticateToken, isManagerOrHR, async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.attendanceId);
    if (!attendance) return res.status(404).json({ message: 'Attendance record not found' });
    if (attendance.approvalStatus !== 'pending') {
      return res.status(400).json({ message: `Attendance already ${attendance.approvalStatus}` });
    }
    if (!await canActOnAttendance(req.user, attendance)) {
      return res.status(403).json({ message: 'You are not authorized to decline this record' });
    }

    const actorId = (req.user._id || req.user.id).toString();
    const prev = { status: attendance.status, approvalStatus: attendance.approvalStatus };

    attendance.approvalStatus = 'declined';
    attendance.status = 'absent';
    attendance.approvedBy = actorId;
    attendance.approvedAt = new Date();
    if (req.body.notes) attendance.managerNotes = req.body.notes;
    attendance.auditLog.push({
      actorId, actorRole: req.user.role, action: 'declined',
      previousStatus: prev.status, previousApprovalStatus: prev.approvalStatus,
      newStatus: 'absent', newApprovalStatus: 'declined',
      notes: req.body.notes
    });

    await attendance.save();
    res.json({ message: 'Attendance declined', attendance });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/mark-late/:attendanceId', authenticateToken, isManagerOrHR, async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.attendanceId);
    if (!attendance) return res.status(404).json({ message: 'Attendance record not found' });
    if (attendance.approvalStatus !== 'pending') {
      return res.status(400).json({ message: `Attendance already ${attendance.approvalStatus}` });
    }
    if (!await canActOnAttendance(req.user, attendance)) {
      return res.status(403).json({ message: 'You are not authorized to act on this record' });
    }

    const actorId = (req.user._id || req.user.id).toString();
    const prev = { status: attendance.status, approvalStatus: attendance.approvalStatus };

    attendance.approvalStatus = 'approved';
    attendance.status = 'late';
    attendance.approvedBy = actorId;
    attendance.approvedAt = new Date();
    if (req.body.notes) attendance.managerNotes = req.body.notes;
    attendance.auditLog.push({
      actorId, actorRole: req.user.role, action: 'marked_late',
      previousStatus: prev.status, previousApprovalStatus: prev.approvalStatus,
      newStatus: 'late', newApprovalStatus: 'approved',
      notes: req.body.notes
    });

    await attendance.save();
    res.json({ message: 'Attendance marked as late', attendance });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/override/:attendanceId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { status, approvalStatus, notes } = req.body;
    const attendance = await Attendance.findById(req.params.attendanceId);
    if (!attendance) return res.status(404).json({ message: 'Attendance record not found' });

    const actorId = (req.user._id || req.user.id).toString();
    const prev = { status: attendance.status, approvalStatus: attendance.approvalStatus };

    if (status) attendance.status = status;
    if (approvalStatus) attendance.approvalStatus = approvalStatus;
    attendance.approvedBy = actorId;
    attendance.approvedAt = new Date();
    if (notes) attendance.managerNotes = notes;
    attendance.auditLog.push({
      actorId, actorRole: 'admin', action: 'overridden',
      previousStatus: prev.status, previousApprovalStatus: prev.approvalStatus,
      newStatus: attendance.status, newApprovalStatus: attendance.approvalStatus,
      notes
    });

    await attendance.save();
    res.json({ message: 'Attendance overridden', attendance });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/correction-request', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'employee') {
      return res.status(403).json({ message: 'Only employees can submit correction requests' });
    }

    const { date, reason, requestedCheckIn, requestedCheckOut } = req.body;
    if (!reason) return res.status(400).json({ message: 'Reason is required' });

    const employeeId = (req.user._id || req.user.id).toString();
    const location = await OfficeLocation.findOne({ isActive: true });
    const timezone = location?.timezone || 'Asia/Kolkata';

    let targetDate;
    if (date) {
      targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
    } else {
      targetDate = getDateInTimezone(timezone);
    }

    let attendance = await Attendance.findOne({ employeeId, date: targetDate });

    if (!attendance) {
      attendance = new Attendance({
        employeeId,
        date: targetDate,
        status: 'absent',
        approvalStatus: 'pending',
        auditLog: [{
          actorId: employeeId,
          actorRole: 'employee',
          action: 'correction_requested',
          newStatus: 'absent',
          newApprovalStatus: 'pending',
          notes: reason
        }]
      });
    } else {
      if (!['declined', 'auto_closed'].includes(attendance.approvalStatus) && attendance.checkIn?.time) {
        return res.status(400).json({ message: 'Correction can only be requested for declined or missing attendance' });
      }
      attendance.approvalStatus = 'pending';
      attendance.auditLog.push({
        actorId: employeeId,
        actorRole: 'employee',
        action: 'correction_requested',
        previousStatus: attendance.status,
        previousApprovalStatus: attendance.approvalStatus,
        notes: reason
      });
    }

    attendance.correctionRequest = {
      requestedBy: employeeId,
      reason,
      requestedCheckIn: requestedCheckIn ? new Date(requestedCheckIn) : undefined,
      requestedCheckOut: requestedCheckOut ? new Date(requestedCheckOut) : undefined,
      status: 'pending'
    };

    await attendance.save();
    res.status(201).json({ message: 'Correction request submitted', attendance });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/correction-review/:attendanceId', authenticateToken, isManagerOrHR, async (req, res) => {
  try {
    const { action, notes } = req.body;
    if (!['approved', 'declined'].includes(action)) {
      return res.status(400).json({ message: 'action must be approved or declined' });
    }

    const attendance = await Attendance.findById(req.params.attendanceId);
    if (!attendance) return res.status(404).json({ message: 'Attendance record not found' });
    if (!attendance.correctionRequest || attendance.correctionRequest.status !== 'pending') {
      return res.status(400).json({ message: 'No pending correction request on this record' });
    }
    if (!await canActOnAttendance(req.user, attendance)) {
      return res.status(403).json({ message: 'You are not authorized to review this correction' });
    }

    const actorId = (req.user._id || req.user.id).toString();
    attendance.correctionRequest.status = action;
    attendance.correctionRequest.reviewedBy = actorId;
    attendance.correctionRequest.reviewedAt = new Date();
    attendance.correctionRequest.reviewNotes = notes;

    if (action === 'approved') {
      if (attendance.correctionRequest.requestedCheckIn) {
        if (!attendance.checkIn) attendance.checkIn = {};
        attendance.checkIn.time = attendance.correctionRequest.requestedCheckIn;
      }
      if (attendance.correctionRequest.requestedCheckOut) {
        if (!attendance.checkOut) attendance.checkOut = {};
        attendance.checkOut.time = attendance.correctionRequest.requestedCheckOut;
      }
      attendance.approvalStatus = 'approved';
      attendance.status = attendance.status === 'absent' ? 'present' : attendance.status;
      attendance.approvedBy = actorId;
      attendance.approvedAt = new Date();
    } else {
      attendance.approvalStatus = 'declined';
    }

    attendance.auditLog.push({
      actorId, actorRole: req.user.role,
      action: action === 'approved' ? 'correction_approved' : 'correction_declined',
      newStatus: attendance.status,
      newApprovalStatus: attendance.approvalStatus,
      notes
    });

    await attendance.save();
    res.json({ message: `Correction request ${action}`, attendance });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/report', authenticateToken, isManagerOrHR, async (req, res) => {
  try {
    const { employeeId, startDate, endDate } = req.query;
    const query = {};

    if (req.user.role === 'manager') {
      const managerId = (req.user._id || req.user.id).toString();
      const reportIds = await getDirectReportIds(managerId);
      if (employeeId) {
        if (!reportIds.includes(employeeId)) {
          return res.status(403).json({ message: 'You can only view reports for your direct reports' });
        }
        query.employeeId = employeeId;
      } else {
        query.employeeId = { $in: reportIds };
      }
    } else {
      if (employeeId) query.employeeId = employeeId;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const attendance = await Attendance.find(query)
      .populate('checkIn.officeLocation', 'name')
      .populate('employeeId', 'firstName lastName email employeeId department')
      .sort({ date: -1 });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/audit-log/:attendanceId', authenticateToken, isManagerOrHR, async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.attendanceId).select('auditLog employeeId');
    if (!attendance) return res.status(404).json({ message: 'Attendance record not found' });

    if (req.user.role === 'manager') {
      const managerId = (req.user._id || req.user.id).toString();
      const reportIds = await getDirectReportIds(managerId);
      if (!reportIds.includes(attendance.employeeId.toString())) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json(attendance.auditLog);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/approval-history', authenticateToken, isManagerOrHR, async (req, res) => {
  try {
    const actorId = (req.user._id || req.user.id).toString();
    const { limit = 30, skip = 0 } = req.query;

    const query = {
      approvedBy: actorId,
      approvalStatus: { $in: ['approved', 'declined'] }
    };

    const history = await Attendance.find(query)
      .populate('checkIn.officeLocation', 'name')
      .populate('employeeId', 'firstName lastName email employeeId department')
      .sort({ approvedAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
