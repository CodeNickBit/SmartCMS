const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const managerSchema = new mongoose.Schema({
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
  temporaryPassword: {
    type: String,
    required: true,
    minlength: 8
  },
  department: {
    type: String,
    required: true,
    enum: ['engineering', 'marketing', 'sales', 'hr', 'finance', 'operations', 'it', 'management'],
    trim: true
  },
  designation: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    default: 'manager'
  },
  joiningDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  isPasswordChanged: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash temporary password before saving
managerSchema.pre('save', async function (next) {
  if (!this.isModified('temporaryPassword')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.temporaryPassword = await bcrypt.hash(this.temporaryPassword, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to compare passwords
managerSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.temporaryPassword);
};

// Instance method to generate full name
managerSchema.methods.getFullName = function () {
  return this.name;
};

// Virtual for formatted joining date
managerSchema.virtual('formattedJoiningDate').get(function () {
  return this.joiningDate.toLocaleDateString();
});

// Static method to find managers by department
managerSchema.statics.findByDepartment = function (department) {
  return this.find({ department, isActive: true });
};

// Static method to find active managers
managerSchema.statics.findActive = function () {
  return this.find({ isActive: true });
};

// Ensure virtual fields are serialized
managerSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.temporaryPassword;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Manager', managerSchema);