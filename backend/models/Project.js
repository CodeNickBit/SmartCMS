const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  dueDate: { type: Date },
  completedAt: { type: Date },
  isCompleted: { type: Boolean, default: false }
}, { _id: true });

const memberSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userModel: { type: String, enum: ['User', 'Manager', 'Hr', 'Admin'], required: true },
  email: { type: String }, // For fallback lookup
  role: { type: String, enum: ['lead', 'member', 'viewer'], default: 'member' },
  addedAt: { type: Date, default: Date.now }
}, { _id: false });

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  status: {
    type: String,
    enum: ['planning', 'active', 'on_hold', 'completed', 'archived'],
    default: 'planning'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  startDate: { type: Date },
  endDate: { type: Date },
  completedAt: { type: Date },
  billable: { type: Boolean, default: false },
  budget: { type: Number, default: 0 },
  createdBy: { type: String, required: true },
  createdByModel: { type: String, enum: ['Admin', 'Manager'], required: true },
  projectManager: { type: String },
  projectManagerModel: { type: String, enum: ['Manager', 'Admin'] },
  projectManagerEmail: { type: String }, // For fallback lookup
  members: [memberSchema],
  milestones: [milestoneSchema],
  tags: [{ type: String, trim: true }],
  department: { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
