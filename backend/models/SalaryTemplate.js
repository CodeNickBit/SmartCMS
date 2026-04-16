const mongoose = require('mongoose');

const componentOverrideSchema = new mongoose.Schema({
    component: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SalaryComponent',
        required: true
    },
    overrideAmount: {
        type: Number
        // If provided, overrides the base component's flat amount or percentage for users on this template
    }
}, { _id: false });

const salaryTemplateSchema = new mongoose.Schema({
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
    components: [componentOverrideSchema],
    isActive: {
        type: Boolean,
        default: true
    },
    isDefaultTemplate: {
        // If true, newly created employees might be assigned this by default
        type: Boolean,
        default: false
    },
    createdBy: {
        type: String,
        ref: 'User'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('SalaryTemplate', salaryTemplateSchema);
