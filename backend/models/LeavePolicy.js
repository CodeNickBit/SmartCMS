const mongoose = require('mongoose');

const leavePolicySchema = new mongoose.Schema({
    leaveName: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    description: {
        type: String,
        trim: true
    },
    allowedRoles: [{
        type: String,
        enum: ['employee', 'manager', 'hr'],
        required: true
    }],
    annualLimit: {
        type: Number,
        required: true,
        min: 0
    },
    minNoticeHours: {
        type: Number,
        default: 0,
        min: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('LeavePolicy', leavePolicySchema);
