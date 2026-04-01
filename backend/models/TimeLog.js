const mongoose = require('mongoose');

const timeLogSchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  employeeId: { type: String, required: true },
  employeeName: { type: String },
  date: { type: Date, required: true, default: Date.now },
  hours: { type: Number, required: true, min: 0.25, max: 24 },
  description: { type: String, trim: true }
}, { timestamps: true });

timeLogSchema.index({ taskId: 1, employeeId: 1 });
timeLogSchema.index({ projectId: 1 });

module.exports = mongoose.model('TimeLog', timeLogSchema);
