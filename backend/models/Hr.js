const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const hrSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    role: {
        type: String,
        default: 'hr',
        immutable: true
    },
    department: {
        type: String,
        default: 'Human Resources'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    permissions: {
        canRegisterEmployees: { type: Boolean, default: true },
        canApproveLeaves: { type: Boolean, default: true },
        canHandlePayroll: { type: Boolean, default: true },
        departmentAccess: [String]
    },
    lastLogin: {
        type: Date
    }
}, {
    timestamps: true
});

// Hash password before saving
hrSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
hrSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Hr', hrSchema);
