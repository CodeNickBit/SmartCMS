const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  dueDate: { type: Date },
  completedAt: { type: Date },
  isCompleted: { type: Boolean, default: false }
}, { _id: true });

const memberSchema = new mongoose.Schema({
  userId: { type: String, required: true, refPath: 'members.userId.userModel' }, // Note: This is slightly tricky for arrays, better to populate manually or use dynamic ref
  userModel: { type: String, enum: ['User', 'Manager', 'Hr', 'Admin'], required: true },
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
  createdBy: { type: String, required: true },
  createdByModel: { type: String, enum: ['Admin', 'Manager'], required: true },
  projectManager: { type: String },
  projectManagerModel: { type: String, enum: ['Manager', 'Admin'] },
  members: [memberSchema],
  milestones: [milestoneSchema],
  tags: [{ type: String, trim: true }],
  department: { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
