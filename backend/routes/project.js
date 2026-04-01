const express = require('express');
const router = express.Router();
const { protect, checkRole } = require('../middleware/authMiddleware');
const pc = require('../controllers/projectController');

router.get('/analytics', protect, pc.getAnalytics);

router.post('/', protect, pc.createProject);
router.get('/', protect, pc.getAllProjects);
router.get('/:id', protect, pc.getProjectById);
router.put('/:id', protect, pc.updateProject);
router.delete('/:id', protect, pc.deleteProject);
router.post('/:id/members', protect, pc.addMembers);
router.delete('/:id/members/:memberId', protect, pc.removeMember);

module.exports = router;
