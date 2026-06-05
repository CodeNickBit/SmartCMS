const WorkflowTemplate = require('../models/WorkflowTemplate');

// Get all workflow templates
exports.getAllTemplates = async (req, res) => {
  try {
    const templates = await WorkflowTemplate.find();
    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching templates', error: error.message });
  }
};

// Get a specific template by type (e.g. onboarding)
exports.getTemplateByType = async (req, res) => {
  try {
    const { type } = req.params;
    const templates = await WorkflowTemplate.find({ type, isActive: true });
    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching templates', error: error.message });
  }
};

// Create a new workflow template
exports.createTemplate = async (req, res) => {
  try {
    const { name, type, isActive, tasks } = req.body;
    const template = new WorkflowTemplate({ name, type, isActive, tasks });
    await template.save();
    res.status(201).json({ message: 'Template created successfully', template });
  } catch (error) {
    res.status(400).json({ message: 'Error creating template', error: error.message });
  }
};

// Update an existing workflow template
exports.updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const template = await WorkflowTemplate.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!template) return res.status(404).json({ message: 'Template not found' });
    res.json({ message: 'Template updated successfully', template });
  } catch (error) {
    res.status(400).json({ message: 'Error updating template', error: error.message });
  }
};

// Delete a workflow template
exports.deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const template = await WorkflowTemplate.findByIdAndDelete(id);
    if (!template) return res.status(404).json({ message: 'Template not found' });
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting template', error: error.message });
  }
};
