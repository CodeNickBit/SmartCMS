const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actorId: { type: String, required: true },
  actorRole: { type: String, required: true },
  action: {
    type: String,
    enum: ['created', 'approved', 'declined', 'marked_late', 'overridden', 'correction_requested', 'correction_approved', 'correction_declined', 'auto_absent'],
    required: true
  },
  previousStatus: String,
  previousApprovalStatus: String,
  newStatus: String,
  newApprovalStatus: String,
  notes: String,
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const correctionRequestSchema = new mongoose.Schema({
  requestedBy: { type: String, required: true, ref: 'User' },
  requestedAt: { type: Date, default: Date.now },
  reason: { type: String, required: true, trim: true, maxlength: 500 },
  requestedCheckIn: Date,
  requestedCheckOut: Date,
  status: {
    type: String,
    enum: ['pending', 'approved', 'declined'],
    default: 'pending'
  },
  reviewedBy: String,
  reviewedAt: Date,
  reviewNotes: String
}, { _id: false });

const attendanceSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    ref: 'User'
  },
  date: {
    type: Date,
    required: true
  },
  checkIn: {
    time: { type: Date },
    location: {
      latitude: { type: Number },
      longitude: { type: Number }
    },
    address: { type: String },
    distance: { type: Number },
    officeLocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OfficeLocation'
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
    enum: ['present', 'absent', 'late', 'half-day', 'on_leave'],
    default: 'present'
  },
  workingHours: {
    type: Number,
    default: 0
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'declined', 'auto_closed'],
    default: 'pending'
  },
  approvedBy: { type: String },
  approvedAt: { type: Date },
  managerNotes: { type: String, trim: true, maxlength: 500 },
  correctionRequest: correctionRequestSchema,
  auditLog: [auditLogSchema],
  isVerified: { type: Boolean, default: false },
  flags: [{
    type: String,
    enum: ['location_mismatch', 'new_device', 'unusual_time', 'multiple_checkin']
  }]
}, {
  timestamps: true
});

attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

attendanceSchema.pre('save', function (next) {
  if (this.checkIn?.time && this.checkOut?.time) {
    const ms = new Date(this.checkOut.time) - new Date(this.checkIn.time);
    this.workingHours = ms / (1000 * 60 * 60);
  }
  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);
