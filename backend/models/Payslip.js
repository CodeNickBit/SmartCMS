const mongoose = require('mongoose');

const payslipComponentSchema = new mongoose.Schema({
    component: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SalaryComponent',
        required: true
    },
    name: { type: String, required: true },
    type: { type: String, enum: ['earning', 'deduction'], required: true },
    calculationType: { type: String, enum: ['flat', 'percentage'], required: true },
    resolvedAmount: { type: Number, required: true },
    isProRated: { type: Boolean, default: false },
    isPartOfGross: { type: Boolean, default: true }
}, { _id: false });

const payslipSchema = new mongoose.Schema({
    employeeId: {
        type: String,
        required: true,
        ref: 'User'
    },
    payPeriod: {
        year: { type: Number, required: true },
        month: { type: Number, required: true, min: 1, max: 12 },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true }
    },
    daysInMonth: { type: Number, required: true },
    paidDays: { type: Number, required: true },
    lopDays: { type: Number, default: 0 },
    salaryTemplate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SalaryTemplate'
    },
    components: [payslipComponentSchema],
    grossEarnings: { type: Number, required: true },
    totalDeductions: { type: Number, required: true },
    netPay: { type: Number, required: true },
    status: {
        type: String,
        enum: ['draft', 'pending_approval', 'approved', 'locked', 'rejected'],
        default: 'draft'
    },
    approvedBy: { type: String, ref: 'User' },
    approvedAt: { type: Date },
    lockedAt: { type: Date },
    notes: { type: String, trim: true },
    generatedBy: { type: String, ref: 'User' }
}, {
    timestamps: true
});

payslipSchema.index({ employeeId: 1, 'payPeriod.year': 1, 'payPeriod.month': 1 }, { unique: true });

module.exports = mongoose.model('Payslip', payslipSchema);
