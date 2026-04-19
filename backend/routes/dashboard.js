const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const dashboardController = require('../controllers/dashboardController');

router.get('/hr-pulse', protect, dashboardController.getHRPulse);
router.get('/manager-deadlines', protect, dashboardController.getManagerDeadlines);
router.get('/admin-stats', protect, dashboardController.getAdminDashboardStats);

module.exports = router;
