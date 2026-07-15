const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    serialNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['Available', 'Assigned', 'Maintenance', 'Retired'],
        default: 'Available'
    },
    assignedTo: {
        type: String,
        ref: 'User',
        default: null
    },
    assignmentDate: {
        type: Date,
        default: null
    },
    returnDate: {
        type: Date,
        default: null
    },
    purchaseDate: {
        type: Date
    },
    purchaseCost: {
        type: Number
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Asset', assetSchema);
