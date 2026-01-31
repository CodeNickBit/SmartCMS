const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    ref: 'User'
  },
  date: {
    type: Date,
    required: true,
    default: () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today;
    }
  },
  checkIn: {
    time: {
      type: Date,
      required: true
    },
    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true }
    },
    address: {
      type: String,
      required: true
    },
    distance: {
      type: Number,
      required: true
    },
    officeLocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OfficeLocation',
      required: true
    },
    ipAddress: String,
    deviceFingerprint: String
  },
  checkOut: {
    time: Date,
    location: {
      latitude: Number,
      longitude: Number
    },
    address: String
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'half-day'],
    default: 'present'
  },
  workingHours: {
    type: Number,
    default: 0
  },
  // Manager Approval Workflow Fields
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'declined', 'marked_late'],
    default: 'pending'
  },
  approvedBy: {
    type: String,
    ref: 'User' // Manager who approved/declined
  },
  approvedAt: {
    type: Date
  },
  managerNotes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  isVerified: {
    type: Boolean,
    default: true
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  flags: [{
    type: String,
    enum: ['location_mismatch', 'new_device', 'unusual_time', 'multiple_checkin']
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

attendanceSchema.pre('save', function (next) {
  this.updatedAt = Date.now();

  if (this.checkIn && this.checkOut) {
    const checkInTime = new Date(this.checkIn.time).getTime();
    const checkOutTime = new Date(this.checkOut.time).getTime();
    this.workingHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);
  }

  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);
