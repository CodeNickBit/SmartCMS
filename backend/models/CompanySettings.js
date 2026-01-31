const mongoose = require('mongoose');

const companySettingsSchema = new mongoose.Schema({
    generalLeaveRules: [{
        type: String,
        trim: true
    }],
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Assuming generic User or specific Admin model reference if needed
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('CompanySettings', companySettingsSchema);
