const mongoose = require('mongoose');

const companySettingsSchema = new mongoose.Schema({
    generalLeaveRules: [{
        type: String,
        trim: true
    }],
    assetCategories: [{
        type: String,
        trim: true,
        default: ['Laptop', 'Monitor', 'Mobile', 'Keyboard/Mouse', 'Software License', 'Other']
    }],
    expenseCategories: [{
        type: String,
        trim: true,
        default: ['Travel', 'Food', 'Accommodation', 'Internet', 'Office Supplies', 'Other']
    }],
    payrollSettings: {
        frequency: {
            type: String,
            enum: ['monthly', 'bi-weekly', 'weekly'],
            default: 'monthly'
        },
        payPeriodStartDay: {
            type: Number,
            default: 1,
            min: 1,
            max: 28
        },
        salaryDisbursalDay: {
            type: Number,
            default: 30,
            min: 1,
            max: 31
        },
        lopRules: {
            enabled: { type: Boolean, default: true },
            considerLateMarksAsLOP: { type: Boolean, default: false },
            lateMarksThreshold: { type: Number, default: 3 },
            absentWithoutApprovalIsLOP: { type: Boolean, default: true }
        },
        overtimeRules: {
            enabled: { type: Boolean, default: false },
            standardWorkHoursPerDay: { type: Number, default: 8 },
            overtimeMultiplier: { type: Number, default: 1.5 },
            overtimeEarningComponentId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'SalaryComponent'
            }
        }
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('CompanySettings', companySettingsSchema);
