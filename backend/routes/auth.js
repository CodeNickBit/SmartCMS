const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Admin = require('../models/Admin');
const Manager = require('../models/Manager');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const otpStore = new Map();

function createTransporter() {
  const emailUser = (process.env.EMAIL_USER || 'ankbizzcorp@gmail.com').trim();

  // Remove all spaces from app password (Google app passwords should be 16 characters without spaces)
  const emailPassword = process.env.EMAIL_PASSWORD
    ? process.env.EMAIL_PASSWORD.trim().replace(/\s+/g, '')
    : '';

  if (!emailPassword) {
    console.error('EMAIL_PASSWORD is not set in .env file');
    throw new Error('Email configuration error: EMAIL_PASSWORD is required');
  }

  console.log('Creating email transporter for:', emailUser);
  console.log('Password length:', emailPassword.length);

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPassword
    }
  });
}

router.post('/register', async (req, res) => {
  try {
    const {
      // Personal Details
      firstName,
      middleName,
      lastName,
      gender,
      dateOfBirth,
      maritalStatus,
      phone,
      email,
      currentAddress,
      permanentAddress,
      emergencyContactName,
      emergencyContactNumber,

      // Gender-based conditional fields
      fatherGuardianName,
      guardianContact,
      spouseName,
      spouseContactNumber,
      marriageDate,
      preferredName,
      pronouns,

      // Professional Details
      employeeId,
      department,
      designation,
      reportingManager,
      joiningDate,
      employmentType,
      workLocation,
      shiftType,

      // Work & Pay Details
      workingHoursStart,
      workingHoursEnd,
      weeklyWorkingDays,
      wageType,
      salaryAmount,
      allowances,
      overtimeEligible,
      bankAccountNumber,
      bankName,
      bankIFSC,
      pfApplicable,
      esicApplicable,

      // Maternity & Flexible Hours
      maternityEligible,
      flexibleWorkingHours,

      // Phase 2: Pregnancy tracking
      pregnancyStatus,
      expectedDeliveryDate,
      medicalFitnessCertificate,

      // Authentication
      password
    } = req.body;

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user exists by email or employeeId
    const effectiveEmployeeId = (employeeId === 'TO BE GENERATED' || !employeeId) ? undefined : employeeId.trim().toUpperCase();

    const existingUser = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { employeeId: effectiveEmployeeId ? effectiveEmployeeId : null }
      ].filter(cond => cond.employeeId !== null || cond.email)
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists with this email or employee ID'
      });
    }

    // Default values for internal fields
    const autoMaternityEligible = gender === 'Female' && maritalStatus === 'Married';

    // Create user instance first to get the generated _id
    const user = new User({
      // Personal Details
      firstName,
      middleName: middleName || undefined,
      lastName,
      gender,
      dateOfBirth: dateOfBirth || undefined,
      // Age is calculated via pre-save hook in model
      maritalStatus: maritalStatus || undefined,
      phone,
      email: normalizedEmail,
      currentAddress,
      permanentAddress,
      emergencyContactName,
      emergencyContactNumber,

      // Gender-based conditional fields
      fatherGuardianName: (gender === 'Female' && maritalStatus === 'Single') ? fatherGuardianName : undefined,
      guardianContact: (gender === 'Female' && maritalStatus === 'Single') ? guardianContact : undefined,
      spouseName: (gender === 'Female' && maritalStatus === 'Married') ? spouseName : undefined,
      spouseContactNumber: (gender === 'Female' && maritalStatus === 'Married') ? spouseContactNumber : undefined,
      marriageDate: (gender === 'Female' && maritalStatus === 'Married') ? (marriageDate || undefined) : undefined,
      preferredName: (gender === 'Other') ? preferredName : undefined,
      pronouns: (gender === 'Other') ? pronouns : undefined,

      // Professional Details
      employeeId: effectiveEmployeeId,
      department,
      designation,
      reportingManager: reportingManager || undefined,
      joiningDate: joiningDate || undefined,
      employmentType,
      workLocation,
      shiftType: shiftType || undefined,

      // Work & Pay Details
      workingHoursStart: workingHoursStart || undefined,
      workingHoursEnd: workingHoursEnd || undefined,
      weeklyWorkingDays: weeklyWorkingDays || 5,
      wageType: wageType || undefined,
      salaryAmount: salaryAmount || undefined,
      allowances: allowances || 0,
      overtimeEligible: overtimeEligible || false,
      bankAccountNumber: bankAccountNumber || undefined,
      bankName: bankName || undefined,
      bankIFSC: bankIFSC || undefined,
      pfApplicable: pfApplicable || false,
      esicApplicable: esicApplicable || false,

      // Maternity & Flexible Hours
      maternityEligible: maternityEligible !== undefined ? maternityEligible : autoMaternityEligible,
      flexibleWorkingHours: flexibleWorkingHours || false,

      // Phase 2: Pregnancy tracking
      pregnancyStatus: pregnancyStatus || 'Not Pregnant',
      expectedDeliveryDate: expectedDeliveryDate || undefined,
      medicalFitnessCertificate: medicalFitnessCertificate || undefined,

      // Authentication
      password
    });

    if (!user.employeeId) {
      user.employeeId = user._id;
    }

    if (reportingManager && String(reportingManager).trim()) {
      const rm = String(reportingManager).trim();
      let manager = null;
      if (/^[0-9a-fA-F]{24}$/.test(rm)) {
        manager = await Manager.findById(rm);
      }
      if (!manager) {
        manager = await Manager.findOne({ email: new RegExp(`^${rm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
      }
      if (manager) {
        user.reportingManager = String(manager._id);
      } else {
        return res.status(400).json({ message: 'Reporting manager not found. Please select a valid manager from the list (name and email).' });
      }
    }

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: 'User registered successfully',
      user: userResponse
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'User already exists with this email or employee ID'
      });
    }
    console.error('Registration error:', error);
    res.status(400).json({
      message: 'Registration failed',
      error: error.message
    });
  }
});

// Register Admin route
router.post('/register-admin', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const normalizedEmail = email.trim().toLowerCase();

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: normalizedEmail });
    if (existingAdmin) {
      return res.status(400).json({
        message: 'Admin already exists with this email'
      });
    }

    // Create new admin
    const admin = new Admin({
      name,
      email: normalizedEmail,
      password,
      role: role || 'admin'
    });

    await admin.save();

    res.status(201).json({
      message: 'Admin registered successfully',
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Admin registration failed',
      error: error.message
    });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = { $regex: new RegExp(`^${normalizedEmail}$`, 'i') };

    console.log('Login attempt for:', normalizedEmail);

    let user = null;
    let role = null;
    let collectionName = '';

    const emp = await User.findOne({ email: emailRegex });
    console.log('Employee found:', !!emp);
    if (emp) {
      console.log('Employee email:', emp.email, 'Active:', emp.active_inactive);
      if (emp.active_inactive === false) return res.status(401).json({ message: 'Account deactivated' });
      const passwordMatch = await emp.comparePassword(password);
      console.log('Employee password match:', passwordMatch);
      if (passwordMatch) {
        user = emp;
        role = 'employee';
        collectionName = 'User';
        console.log('Logging in as EMPLOYEE');
      }
    }

    if (!user) {
      const admin = await Admin.findOne({ email: emailRegex });
      console.log('Admin found:', !!admin);
      if (admin) {
        if (!admin.isActive) return res.status(401).json({ message: 'Account deactivated' });

        let isValid = false;
        const isHashed = admin.password.startsWith('$2a$') || admin.password.startsWith('$2b$') || admin.password.startsWith('$2y$');
        console.log('Admin password hashed:', isHashed);
        if (isHashed) {
          isValid = await admin.comparePassword(password);
        } else if (admin.password === password) {
          isValid = true;
        }
        console.log('Admin password valid:', isValid);

        if (isValid) {
          user = admin;
          role = admin.role;
          collectionName = 'Admin';
        }
      }
    }

    if (!user) {
      const Hr = require('../models/Hr');
      const hr = await Hr.findOne({ email: emailRegex });
      console.log('HR found:', !!hr);
      if (hr) {
        if (!hr.isActive) return res.status(401).json({ message: 'Account deactivated' });
        const passwordMatch = await hr.comparePassword(password);
        console.log('HR password match:', passwordMatch);
        if (passwordMatch) {
          user = hr;
          role = 'hr';
          collectionName = 'Hr';
          console.log('Logging in as HR');
        }
      }
    }

    if (!user) {
      const Manager = require('../models/Manager');
      const manager = await Manager.findOne({ email: emailRegex });
      if (manager) {
        if (!manager.isActive) return res.status(401).json({ message: 'Account deactivated' });
        if (await manager.comparePassword(password)) {
          user = manager;
          role = 'manager';
          collectionName = 'Manager';
        }
      }
    }

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    // Login Successful
    // Update last login without triggering full validation (to support legacy data)
    const lastLogin = new Date();
    if (user.constructor && user.constructor.findByIdAndUpdate) {
      await user.constructor.findByIdAndUpdate(user._id, { lastLogin });
    }
    user.lastLogin = lastLogin; // Update local instance for response
    // await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;
    if (userResponse.temporaryPassword) delete userResponse.temporaryPassword;

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, role: role, name: user.name || user.firstName + ' ' + user.lastName },
      process.env.JWT_SECRET || 'secret_key_change_this_in_production',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      user: userResponse,
      token: token,
      role: role
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Login failed',
      error: error.message
    });
  }
});

router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: 'Email is required'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        message: 'Please provide a valid email address'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    let transporter;
    try {
      transporter = createTransporter();
    } catch (transporterError) {
      console.error('Transporter creation error:', transporterError);
      return res.status(500).json({
        message: 'Email service configuration error. Please contact administrator.'
      });
    }

    try {
      await transporter.verify();
      console.log('Email transporter verified successfully');
    } catch (verifyError) {
      console.error('Email transporter verification failed:', verifyError);
      return res.status(500).json({
        message: 'Email service is not available. Please try again later.'
      });
    }

    let otp = crypto.randomInt(100000, 999999).toString();

    otpStore.set(normalizedEmail, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    const emailUser = (process.env.EMAIL_USER || 'ankbizzcorp@gmail.com').trim();
    const mailOptions = {
      from: emailUser,
      to: normalizedEmail,
      subject: 'Email Verification - SmartCMS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3083DC;">Email Verification</h2>
          <p>Your verification code is:</p>
          <h1 style="color: #3083DC; font-size: 32px; letter-spacing: 8px; text-align: center; padding: 20px; background: #f0f0f0; border-radius: 8px;">${otp}</h1>
          <p>This code will expire in 5 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 12px;">Smart Corporate Management System</p>
        </div>
      `
    };

    try {
      const emailResult = await transporter.sendMail(mailOptions);
      console.log(`OTP sent successfully to ${normalizedEmail}. MessageId: ${emailResult.messageId}`);
      res.status(200).json({
        message: 'OTP sent successfully to your email'
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      console.error('Error code:', emailError.code);
      console.error('Error command:', emailError.command);
      console.error('Error response:', emailError.response);

      // Remove stored OTP if email sending failed
      otpStore.delete(normalizedEmail);

      // Provide more specific error messages based on error code
      let errorMessage = 'Failed to send OTP. Please try again.';
      let statusCode = 500;

      if (emailError.code === 'EAUTH') {
        errorMessage = 'Email authentication failed. Please check email configuration.';
      } else if (emailError.code === 'ECONNECTION' || emailError.code === 'ETIMEDOUT') {
        errorMessage = 'Could not connect to email server. Please try again later.';
        statusCode = 503;
      } else if (emailError.code === 'EENVELOPE') {
        errorMessage = 'Invalid email address. Please check and try again.';
        statusCode = 400;
      }

      return res.status(statusCode).json({
        message: errorMessage
      });
    }

  } catch (error) {
    console.error('Unexpected error in send-otp endpoint:', error);
    console.error('Error stack:', error.stack);

    res.status(500).json({
      message: 'Internal server error during OTP process. Please try again.'
    });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, isPasswordReset } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: 'Email and OTP are required'
      });
    }

    const normalizedEmail = email.toLowerCase();
    const storedOtpData = otpStore.get(normalizedEmail);

    if (!storedOtpData) {
      return res.status(400).json({
        message: 'OTP not found or expired. Please request a new OTP.'
      });
    }

    if (Date.now() > storedOtpData.expiresAt) {
      otpStore.delete(normalizedEmail);
      return res.status(400).json({
        message: 'OTP has expired. Please request a new OTP.'
      });
    }

    if (storedOtpData.otp !== otp) {
      return res.status(400).json({
        message: 'Invalid OTP. Please try again.'
      });
    }

    // If this is for password reset, generate a temporary token instead of just deleting
    if (isPasswordReset) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      otpStore.set(normalizedEmail, {
        resetToken,
        expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes to reset password
      });
      return res.json({
        message: 'OTP verified',
        verified: true,
        resetToken
      });
    }

    // OTP verified successfully - remove from store
    otpStore.delete(normalizedEmail);

    res.json({
      message: 'Email verified successfully',
      verified: true
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      message: 'Failed to verify OTP. Please try again.',
      error: error.message
    });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword, resetToken } = req.body;

    if (!email || !newPassword || !resetToken) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const normalizedEmail = email.toLowerCase();
    const storedData = otpStore.get(normalizedEmail);

    if (!storedData || !storedData.resetToken || storedData.resetToken !== resetToken) {
      return res.status(400).json({ message: 'Invalid or expired reset session. Please try again.' });
    }

    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(normalizedEmail);
      return res.status(400).json({ message: 'Session expired. Please try again.' });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password = newPassword;
    await user.save();

    otpStore.delete(normalizedEmail);
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reset password', error: error.message });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
});

// Update user
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    delete updates.password;

    if (updates.reportingManager !== undefined && updates.reportingManager !== null && String(updates.reportingManager).trim()) {
      const rm = String(updates.reportingManager).trim();
      let manager = null;
      if (/^[0-9a-fA-F]{24}$/.test(rm)) {
        manager = await Manager.findById(rm);
      }
      if (!manager) {
        manager = await Manager.findOne({ email: new RegExp(`^${rm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
      }
      if (manager) {
        updates.reportingManager = String(manager._id);
      } else {
        return res.status(400).json({ message: 'Reporting manager not found. Please select a valid manager from the list.' });
      }
    }

    const user = await User.findByIdAndUpdate(id, updates, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user', error: error.message });
  }
});

// Update user status
router.patch('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const user = await User.findByIdAndUpdate(id, { active_inactive: status }, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user status', error: error.message });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
});

module.exports = router;
