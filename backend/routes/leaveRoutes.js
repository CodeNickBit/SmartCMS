const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const { protect, checkRole } = require('../middleware/authMiddleware');
const leaveBalanceController = require('../controllers/leaveBalanceController');
const upload = require('../middleware/upload');

// ... Leaves
router.post('/apply', upload.array('attachments', 3), leaveController.applyForLeave);
router.post('/cancel/:id', leaveController.cancelLeave);
router.get('/my-leaves/:userId', leaveController.getMyLeaves);
router.get('/manager-requests/:managerId', leaveController.getManagerLeaves);
router.get('/team-calendar/:managerId', leaveController.getTeamCalendar);
router.put('/:id/status', protect, checkRole(['manager']), leaveController.updateLeaveStatus);
router.put('/:id', leaveController.updateLeaveRequest);

// ... Year End (Admin Only)
router.get('/year-end/preview', protect, checkRole(['admin', 'hr']), leaveBalanceController.previewYearEnd);
router.post('/year-end/execute', protect, checkRole(['admin']), leaveBalanceController.executeYearEnd);

module.exports = router;
