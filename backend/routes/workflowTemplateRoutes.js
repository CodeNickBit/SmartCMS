const express = require('express');
const router = express.Router();
const { protect, isHR } = require('../middleware/authMiddleware');
const workflowTemplateController = require('../controllers/workflowTemplateController');

// All routes require authentication
router.use(protect);

router.get('/', isHR, workflowTemplateController.getAllTemplates);
router.get('/type/:type', isHR, workflowTemplateController.getTemplateByType);
router.post('/', isHR, workflowTemplateController.createTemplate);
router.put('/:id', isHR, workflowTemplateController.updateTemplate);
router.delete('/:id', isHR, workflowTemplateController.deleteTemplate);

module.exports = router;
