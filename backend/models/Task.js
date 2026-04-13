const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  authorId: { type: String, required: true },
  authorName: { type: String, required: true },
  authorRole: { type: String, required: true },
  text: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const activitySchema = new mongoose.Schema({
  action: { type: String, required: true },
  performedBy: { type: String, required: true },
  performedByName: { type: String },
  at: { type: Date, default: Date.now }
}, { _id: false });

const attachmentSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: true });

const taskSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  milestoneId: { type: mongoose.Schema.Types.ObjectId },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  status: {
    type: String,
    enum: ['todo', 'in_progress', 'in_review', 'done', 'blocked'],
    default: 'todo'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  assignedTo: { type: String },
  assignedToName: { type: String },
  assignedToModel: { type: String, enum: ['User', 'Manager', 'Hr', 'Admin'] },
  assignedBy: { type: String },
  assignedByName: { type: String },
  dueDate: { type: Date },
  completedAt: { type: Date },
  estimatedHours: { type: Number, min: 0, default: 0 },
  loggedHours: { type: Number, min: 0, default: 0 },
  parentTask: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  attachments: [attachmentSchema],
  comments: [commentSchema],
  activityLog: [activitySchema]
}, { timestamps: true });

taskSchema.index({ projectId: 1, status: 1 });
taskSchema.index({ assignedTo: 1, status: 1 });

module.exports = mongoose.model('Task', taskSchema);
