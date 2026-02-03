const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const OfficeLocation = require('../models/OfficeLocation');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/check-in', authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude, address, distance, officeLocationId, ipAddress, deviceFingerprint } = req.body;
    const employeeId = req.user.id;

    if (!latitude || !longitude || !address || distance === undefined || !officeLocationId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingAttendance = await Attendance.findOne({
      employeeId,
      date: today
    });

    if (existingAttendance && existingAttendance.checkIn) {
      return res.status(400).json({ message: 'Already checked in today' });
    }

    const officeLocation = await OfficeLocation.findById(officeLocationId);
    if (!officeLocation) {
      return res.status(404).json({ message: 'Office location not found' });
    }

    if (distance > officeLocation.radius) {
      return res.status(400).json({
        message: `You are ${Math.round(distance)}m away from ${officeLocation.name}. Please move closer.`,
        distance,
        requiredRadius: officeLocation.radius
      });
    }

    const attendance = new Attendance({
      employeeId,
      date: today,
      checkIn: {
        time: new Date(),
        location: { latitude, longitude },
        address,
        distance,
        officeLocation: officeLocationId,
        ipAddress,
        deviceFingerprint
      },
      status: 'present',
      approvalStatus: 'pending'
    });

    console.log('Creating attendance record:', attendance); // Debug log

    await attendance.save();

    console.log('Attendance saved successfully:', attendance._id); // Debug log

    res.status(201).json({
      message: 'Check-in successful.',
      attendance,
      officeName: officeLocation.name
    });
  } catch (error) {
    console.error('Error during check-in:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


router.post('/check-out', authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude, address } = req.body;
    const employeeId = req.user.id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employeeId,
      date: today
    });

    if (!attendance) {
      return res.status(404).json({ message: 'No check-in record found for today' });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ message: 'Already checked out today' });
    }

    attendance.checkOut = {
      time: new Date(),
      location: { latitude, longitude },
      address
    };

    await attendance.save();

    res.json({
      message: 'Check-out successful',
      attendance,
      workingHours: attendance.workingHours
    });
  } catch (error) {
    console.error('Error during check-out:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/today', authenticateToken, async (req, res) => {
  try {
    const employeeId = req.user.id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employeeId,
      date: today
    }).populate('checkIn.officeLocation');

    res.json(attendance);
  } catch (error) {
    console.error('Error fetching today attendance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/my-attendance', authenticateToken, async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { startDate, endDate, limit = 30 } = req.query;

    const query = { employeeId };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const attendance = await Attendance.find(query)
      .populate('checkIn.officeLocation')
      .sort({ date: -1 })
      .limit(parseInt(limit));

    res.json(attendance);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/report', authenticateToken, async (req, res) => {
  try {
    const { employeeId, startDate, endDate } = req.query;

    const query = {};
    if (employeeId) query.employeeId = employeeId;

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const attendance = await Attendance.find(query)
      .populate('checkIn.officeLocation')
      .sort({ date: -1 });

    res.json(attendance);
  } catch (error) {
    console.error('Error fetching attendance report:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== MANAGER APPROVAL ROUTES ====================

// Debug endpoint to check manager-employee relationships
router.get('/debug/my-reports', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Only managers can access this endpoint' });
    }

    const User = require('../models/User');
    const managerName = req.user.name;
    const managerId = req.user.id;
    const managerEmail = req.user.email;

    const allUsers = await User.find({}).select('_id firstName lastName email reportingManager');
    
    const reportingUsers = await User.find({
      $or: [
        { reportingManager: managerId.toString() },
        { reportingManager: managerName },
        { reportingManager: managerEmail },
        { reportingManager: { $regex: new RegExp(`^${managerName}$`, 'i') } }
      ]
    }).select('_id firstName lastName email reportingManager');

    res.json({
      manager: {
        id: managerId,
        name: managerName,
        email: managerEmail
      },
      reportingEmployees: reportingUsers.map(u => ({
        id: u._id,
        name: `${u.firstName} ${u.lastName}`,
        email: u.email,
        reportingManager: u.reportingManager
      })),
      totalEmployees: allUsers.length,
      reportingCount: reportingUsers.length,
      allEmployeesReportingManagers: allUsers.map(u => ({
        id: u._id,
        name: `${u.firstName} ${u.lastName}`,
        reportingManager: u.reportingManager
      }))
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Debug endpoint to check all pending attendance
router.get('/debug/all-pending', authenticateToken, async (req, res) => {
  try {
    const allPending = await Attendance.find({ approvalStatus: 'pending' })
      .populate('employeeId', 'firstName lastName email reportingManager')
      .populate('checkIn.officeLocation', 'name')
      .sort({ 'checkIn.time': -1 });

    res.json({
      total: allPending.length,
      records: allPending.map(a => ({
        id: a._id,
        employee: a.employeeId ? {
          id: a.employeeId._id,
          name: `${a.employeeId.firstName} ${a.employeeId.lastName}`,
          email: a.employeeId.email,
          reportingManager: a.employeeId.reportingManager
        } : null,
        checkInTime: a.checkIn.time,
        office: a.checkIn.officeLocation?.name,
        approvalStatus: a.approvalStatus
      }))
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all pending attendance requests (for managers)
router.get('/pending-approvals', authenticateToken, async (req, res) => {
  try {
    console.log('Fetching pending approvals...'); // Debug log

    const { limit = 50, skip = 0 } = req.query;
    const query = { approvalStatus: 'pending' };

    // If manager, only show their direct reports
    if (req.user.role === 'manager') {
      const User = require('../models/User');
      const managerName = req.user.name;
      const managerId = req.user.id;

      console.log(`Manager ${managerName} (${managerId}) searching for reports...`);

      // Query to find employees reporting to this manager
      // reportingManager can be stored as: manager name, manager email, or manager ID
      const reportingUsers = await User.find({
        $or: [
          { reportingManager: managerId.toString() },
          { reportingManager: managerName },
          { reportingManager: req.user.email },
          { reportingManager: { $regex: new RegExp(`^${managerName}$`, 'i') } }
        ]
      }).select('_id firstName lastName email reportingManager');

      const userIds = reportingUsers.map(u => u._id);
      
      console.log(`Found ${userIds.length} reporting employees:`, userIds);
      console.log('Employee details:', reportingUsers.map(u => ({
        id: u._id,
        name: `${u.firstName} ${u.lastName}`,
        reportingManager: u.reportingManager
      })));

      if (userIds.length === 0) {
        console.log('⚠️ No employees found reporting to this manager');
        console.log('Manager details:', { id: managerId, name: managerName, email: req.user.email });
      }

      query.employeeId = { $in: userIds };
    }

    console.log('Query:', query); // Debug log

    const pendingAttendance = await Attendance.find(query)
      .populate('checkIn.officeLocation', 'name')
      .populate('employeeId', 'firstName lastName email employeeId department designation')
      .sort({ 'checkIn.time': -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    console.log('Found pending requests:', pendingAttendance.length); // Debug log

    const totalPending = await Attendance.countDocuments(query);

    res.json({
      attendance: pendingAttendance,
      total: totalPending,
      hasMore: totalPending > (parseInt(skip) + parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Approve attendance
router.post('/approve/:attendanceId', authenticateToken, async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { notes } = req.body;
    const managerId = req.user.id;

    const attendance = await Attendance.findById(attendanceId)
      .populate('employeeId', 'firstName lastName email');

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    if (attendance.approvalStatus !== 'pending') {
      return res.status(400).json({
        message: `Attendance already ${attendance.approvalStatus}`
      });
    }

    attendance.approvalStatus = 'approved';
    attendance.status = 'present';
    attendance.approvedBy = managerId;
    attendance.approvedAt = new Date();
    if (notes) attendance.managerNotes = notes;

    await attendance.save();

    res.json({
      message: 'Attendance approved successfully',
      attendance
    });
  } catch (error) {
    console.error('Error approving attendance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Decline attendance
router.post('/decline/:attendanceId', authenticateToken, async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { notes } = req.body;
    const managerId = req.user.id;

    const attendance = await Attendance.findById(attendanceId)
      .populate('employeeId', 'firstName lastName email');

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    if (attendance.approvalStatus !== 'pending') {
      return res.status(400).json({
        message: `Attendance already ${attendance.approvalStatus}`
      });
    }

    attendance.approvalStatus = 'declined';
    attendance.status = 'absent';
    attendance.approvedBy = managerId;
    attendance.approvedAt = new Date();
    if (notes) attendance.managerNotes = notes;

    await attendance.save();

    res.json({
      message: 'Attendance declined successfully',
      attendance
    });
  } catch (error) {
    console.error('Error declining attendance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark as late
router.post('/mark-late/:attendanceId', authenticateToken, async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { notes } = req.body;
    const managerId = req.user.id;

    const attendance = await Attendance.findById(attendanceId)
      .populate('employeeId', 'firstName lastName email');

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    if (attendance.approvalStatus !== 'pending') {
      return res.status(400).json({
        message: `Attendance already ${attendance.approvalStatus}`
      });
    }

    attendance.approvalStatus = 'marked_late';
    attendance.status = 'late';
    attendance.approvedBy = managerId;
    attendance.approvedAt = new Date();
    if (notes) attendance.managerNotes = notes;

    await attendance.save();

    res.json({
      message: 'Attendance marked as late successfully',
      attendance
    });
  } catch (error) {
    console.error('Error marking attendance as late:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get manager's approval history
router.get('/approval-history', authenticateToken, async (req, res) => {
  try {
    const managerId = req.user.id;
    const { limit = 30, skip = 0 } = req.query;

    const approvalHistory = await Attendance.find({
      approvedBy: managerId,
      approvalStatus: { $in: ['approved', 'declined', 'marked_late'] }
    })
      .populate('checkIn.officeLocation', 'name')
      .populate('employeeId', 'firstName lastName email employeeId department')
      .sort({ approvedAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    res.json(approvalHistory);
  } catch (error) {
    console.error('Error fetching approval history:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
