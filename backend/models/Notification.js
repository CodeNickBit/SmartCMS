const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: String, // String because we use custom YYYYMMDD style IDs everywhere instead of ObjectIds
    required: true,
    ref: 'User'
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['Task', 'Leave', 'Attendance', 'Payroll', 'System', 'General'],
    default: 'General'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  relatedId: {
    type: String, // Optional reference ID (e.g. LeaveRequest ID, Task ID)
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
