const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: function () {
      // Generate a meaningful 11-digit ID: YYMMDD + 5 random digits
      const date = new Date();
      const yy = date.getFullYear().toString().slice(-2);
      const mm = (date.getMonth() + 1).toString().padStart(2, '0');
      const dd = date.getDate().toString().padStart(2, '0');
      const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
      return `${yy}${mm}${dd}${random}`;
    }
  },
  // Personal Details
  firstName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2
  },
  middleName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2
  },
  gender: {
    type: String,
    required: true,
    enum: ['Male', 'Female', 'Other'],
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  maritalStatus: {
    type: String,
    enum: ['Single', 'Married', 'Divorced', 'Widowed'],
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    match: [/^\d{10}$/, 'Phone must be 10 digits']
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  currentAddress: {
    type: String,
    required: true,
    trim: true
  },
  permanentAddress: {
    type: String,
    required: true,
    trim: true
  },
  emergencyContactName: {
    type: String,
    required: true,
    trim: true
  },
  emergencyContactNumber: {
    type: String,
    required: true,
    trim: true,
    match: [/^\d{10}$/, 'Emergency contact number must be 10 digits']
  },

  // Gender-based conditional fields
  // For Unmarried Female
  fatherGuardianName: {
    type: String,
    trim: true
  },
  guardianContact: {
    type: String,
    trim: true,
    match: [/^\d{10}$/, 'Guardian contact must be 10 digits']
  },
  // For Married Female
  spouseName: {
    type: String,
    trim: true
  },
  spouseContactNumber: {
    type: String,
    trim: true,
    match: [/^\d{10}$/, 'Spouse contact number must be 10 digits']
  },
  marriageDate: {
    type: Date
  },
  // For Other/Prefer Not to Say
  preferredName: {
    type: String,
    trim: true
  },
  pronouns: {
    type: String,
    trim: true
  },

  // Last Name Edit Rules
  lastNameEditable: {
    type: Boolean,
    default: false
  },
  lastNameEditUsed: {
    type: Boolean,
    default: false
  },

  // Professional Details
  employeeId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    enum: ['engineering', 'marketing', 'sales', 'hr', 'finance'],
    trim: true
  },
  designation: {
    type: String,
    required: true,
    trim: true
  },
  reportingManager: {
    type: String,
    trim: true
  },
  joiningDate: {
    type: Date,
    required: true
  },
  employmentType: {
    type: String,
    required: true,
    enum: ['full-time', 'contract', 'intern', 'part-time']
  },
  workLocation: {
    type: String,
    required: true,
    trim: true
  },
  shiftType: {
    type: String,
    enum: ['day', 'night', 'rotating', 'flexible'],
    trim: true
  },

  // Work & Pay Details
  workingHoursStart: {
    type: String,
    trim: true
  },
  workingHoursEnd: {
    type: String,
    trim: true
  },
  weeklyWorkingDays: {
    type: Number,
    min: 1,
    max: 7,
    default: 5
  },
  wageType: {
    type: String,
    enum: ['monthly', 'hourly', 'daily', 'weekly'],
    trim: true
  },
  salaryAmount: {
    type: Number,
    min: 0
  },
  allowances: {
    type: Number,
    min: 0,
    default: 0
  },
  overtimeEligible: {
    type: Boolean,
    default: false
  },
  bankAccountNumber: {
    type: String,
    trim: true
  },
  bankName: {
    type: String,
    trim: true
  },
  bankIFSC: {
    type: String,
    trim: true
  },
  pfApplicable: {
    type: Boolean,
    default: false
  },
  esicApplicable: {
    type: Boolean,
    default: false
  },

  // Maternity & Flexible Hours
  maternityEligible: {
    type: Boolean,
    default: false
  },
  flexibleWorkingHours: {
    type: Boolean,
    default: false
  },

  // Phase 2: Pregnancy tracking (optional)
  pregnancyStatus: {
    type: String,
    enum: ['Not Pregnant', 'Pregnant', 'Post-Delivery'],
    default: 'Not Pregnant'
  },
  expectedDeliveryDate: {
    type: Date
  },
  medicalFitnessCertificate: {
    type: String,
    trim: true
  },

  // Authentication
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  role: {
    type: String,
    enum: ['employee'],
    default: 'employee'
  },

  // Status
  active_inactive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Calculate age from dateOfBirth before saving
userSchema.pre('save', function (next) {
  if (this.dateOfBirth && this.isModified('dateOfBirth')) {
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    this.age = age;
  }
  next();
});

// Hash password before saving
userSchema.pre('save', async function (next) {
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
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

