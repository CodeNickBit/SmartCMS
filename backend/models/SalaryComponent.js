const mongoose = require('mongoose');

const salaryComponentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    type: {
        type: String,
        enum: ['earning', 'deduction'],
        required: true
    },
    calculationType: {
        type: String,
        enum: ['flat', 'percentage'],
        required: true
    },
    amountOrPercentage: {
        // If calculationType is 'flat', this is the default amount (can be 0 if only overridden per user)
        // If calculationType is 'percentage', this is the % value
        type: Number,
        required: true,
        default: 0
    },
    percentageOf: {
        // Only used if calculationType is 'percentage'. Refers to another component (e.g., Basic Pay).
        // If null while calculationType is 'percentage', it implies percentage of the Gross Pay (all earnings).
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SalaryComponent'
    },
    isTaxable: {
        // Determines if this component is considered for income tax (TDS)
        type: Boolean,
        default: true
    },
    isStatutory: {
        // Whether this is a statutory component (e.g. PF, ESI)
        type: Boolean,
        default: false
    },
    isPartOfGross: {
        // E.g. Company contribution to PF might be an earning but not part of Gross Pay on payslip
        type: Boolean,
        default: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    dependsOnAttendance: {
        // If true, this component is pro-rated based on NetPayableDays (LOP deduction)
        type: Boolean,
        default: true
    },
    createdBy: {
        type: String,
        ref: 'User'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('SalaryComponent', salaryComponentSchema);
