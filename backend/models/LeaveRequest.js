const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
    userId: {
        type: String, // Referencing custom string ID from User model
        required: true,
        ref: 'User'
    },
    leaveType: {
        type: String,
        required: true,
        trim: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    reason: {
        type: String,
        required: true,
        trim: true
    },
    leaveUnit: {
        type: String,
        enum: ['full-day', 'half-day', 'comp-off'],
        default: 'full-day'
    },
    halfDayPeriod: {
        type: String,
        enum: ['first-half', 'second-half']
    },
    attachments: [{
        filename: String,
        path: String,
        uploadedAt: { type: Date, default: Date.now }
    }],
    modificationHistory: [{
        field: String,
        oldValue: String,
        newValue: String,
        modifiedAt: { type: Date, default: Date.now }
    }],
    lastModifiedAt: Date,
    managerComments: String,
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'Cancelled', 'Changes Requested'],
        default: 'Pending'
    },
    managerId: {
        type: String,
        ref: 'Manager'
    },
    rejectionReason: {
        type: String,
        trim: true
    },
    proxyManagerId: {
        type: String,
        required: false
    },
    resolvedWhileManagerAway: {
        type: Boolean,
        default: false
    },
    resolvedBy: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);
