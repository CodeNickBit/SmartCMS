const mongoose = require('mongoose');

const templateTaskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  assignedToRole: { 
    type: String, 
    enum: ['Admin', 'Hr', 'Manager', 'Reporting_Manager'],
    required: true 
  },
  department: { type: String, trim: true }, // E.g., 'IT' or 'Finance' to further filter assignee
  estimatedHours: { type: Number, default: 0 }
}, { _id: true });

const workflowTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['onboarding', 'offboarding'],
    required: true
  },
  isActive: { type: Boolean, default: true },
  tasks: [templateTaskSchema]
}, { timestamps: true });

module.exports = mongoose.model('WorkflowTemplate', workflowTemplateSchema);
