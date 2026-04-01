const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/authMiddleware');
const tc = require('../controllers/taskController');

router.get('/my-tasks', protect, tc.getMyTasks);

router.post('/projects/:pid/tasks', protect, tc.createTask);
router.get('/projects/:pid/tasks', protect, tc.getProjectTasks);

router.get('/tasks/:id', protect, tc.getTaskById);
router.put('/tasks/:id', protect, tc.updateTask);
router.delete('/tasks/:id', protect, tc.deleteTask);
router.post('/tasks/:id/comments', protect, tc.addComment);
router.post('/tasks/:id/time-log', protect, tc.logTime);
router.get('/tasks/:id/time-log', protect, tc.getTimeLogs);

module.exports = router;
