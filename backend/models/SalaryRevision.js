const mongoose = require('mongoose');

const userOverrideSchema = new mongoose.Schema({
    component: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SalaryComponent',
        required: true
    },
    overrideAmount: {
        type: Number
    }
}, { _id: false });

const salaryRevisionSchema = new mongoose.Schema({
    userId: {
        type: String, // String to match User._id format
        ref: 'User',
        required: true
    },
    effectiveDate: {
        type: Date,
        required: true
    },
    previousTemplate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SalaryTemplate'
    },
    newTemplate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SalaryTemplate',
        required: true
    },
    previousOverrides: [userOverrideSchema],
    newOverrides: [userOverrideSchema],
    reason: {
        type: String,
        trim: true,
        required: true
    },
    approvedBy: {
        type: String,
        ref: 'User' // Who approved the revision (usually HR/Admin)
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('SalaryRevision', salaryRevisionSchema);
