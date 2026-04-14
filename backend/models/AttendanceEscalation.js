const mongoose = require('mongoose');

const attendanceEscalationSchema = new mongoose.Schema({
  attendanceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attendance',
    required: true
  },
  employeeId: {
    type: String,
    ref: 'User',
    required: true
  },
  originalManagerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Manager',
    required: true
  },
  originalManagerName: {
    type: String,
    required: true
  },
  escalatedToManagerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Manager',
    required: true
  },
  escalatedToManagerName: {
    type: String,
    required: true
  },
  escalatedToManagerEmail: {
    type: String,
    required: true
  },
  escalatedToManagerDepartment: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    enum: ['manager_on_leave', 'manager_absent', 'backup_manager_absent', 'manual_escalation'],
    required: true
  },
  escalationDate: {
    type: Date,
    default: Date.now
  },
  checkInDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'cancelled'],
    default: 'active'
  },
  resolvedAt: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

attendanceEscalationSchema.index({ employeeId: 1, checkInDate: -1 });
attendanceEscalationSchema.index({ escalatedToManagerId: 1, status: 1 });
attendanceEscalationSchema.index({ attendanceId: 1 });

module.exports = mongoose.model('AttendanceEscalation', attendanceEscalationSchema);
