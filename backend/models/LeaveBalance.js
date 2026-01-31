const mongoose = require('mongoose');

const leaveBalanceSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        ref: 'User'
    },
    year: {
        type: Number,
        required: true
    },
    leaveType: {
        type: String,
        required: true
    },
    openingBalance: {
        type: Number,
        default: 0
    },
    used: {
        type: Number,
        default: 0
    },
    carryForward: {
        type: Number,
        default: 0
    },
    encashed: {
        type: Number,
        default: 0
    },
    lapsed: {
        type: Number,
        default: 0
    },
    closingBalance: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    compoundIndexes: [{ userId: 1, year: 1, leaveType: 1 }]
});

module.exports = mongoose.model('LeaveBalance', leaveBalanceSchema);
