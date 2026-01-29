const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const { protect, checkRole } = require('../middleware/authMiddleware');

router.post('/apply', leaveController.applyForLeave);
router.get('/my-leaves/:userId', leaveController.getMyLeaves);
router.get('/manager-requests/:managerId', leaveController.getManagerLeaves);
router.put('/:id/status', protect, checkRole(['manager']), leaveController.updateLeaveStatus);

module.exports = router;
