const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    employee: {
        type: String,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'USD'
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    expenseDate: {
        type: Date,
        required: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    receiptUrl: {
        type: String, // Local path or S3 url
        default: null
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'Reimbursed'],
        default: 'Pending'
    },
    approvedBy: {
        type: String,
        ref: 'User',
        default: null
    },
    rejectionReason: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Expense', expenseSchema);
