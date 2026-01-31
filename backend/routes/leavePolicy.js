const express = require('express');
const router = express.Router();
const leavePolicyController = require('../controllers/leavePolicyController');

// Settings Routes
router.get('/settings', leavePolicyController.getSettings);
router.put('/settings', leavePolicyController.updateSettings);

// Policy Routes
router.post('/', leavePolicyController.createPolicy);
router.get('/', leavePolicyController.getAllPolicies);
router.put('/:id', leavePolicyController.updatePolicy);
router.delete('/:id', leavePolicyController.deletePolicy);

module.exports = router;
