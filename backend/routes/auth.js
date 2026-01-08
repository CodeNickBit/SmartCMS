const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Admin = require('../models/Admin');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

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
      firstName,
      lastName,
      email,
      phone,
      password,
      employeeId,
      department,
      designation,
      employmentType,
      joiningDate
    } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { employeeId }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists with this email or employee ID'
      });
    }

    const user = new User({
      firstName,
      lastName,
      email,
      phone,
      password,
      employeeId,
      department,
      designation,
      employmentType,
      joiningDate: joiningDate || undefined
    });

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

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        message: 'Admin already exists with this email'
      });
    }

    // Create new admin
    const admin = new Admin({
      name,
      email,
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

    // First check if it's an admin
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (admin) {
      // Check if admin is active
      if (!admin.isActive) {
        return res.status(401).json({
          message: 'Account is deactivated. Please contact administrator.'
        });
      }

      // Check password - handle both hashed and plain text (for manually inserted records)
      let isPasswordValid = false;
      const isHashed = admin.password.startsWith('$2a$') || admin.password.startsWith('$2b$') || admin.password.startsWith('$2y$');

      if (isHashed) {
        // Password is already hashed, use comparePassword
        isPasswordValid = await admin.comparePassword(password);
      } else {
        // Password is plain text (manually inserted), compare directly
        if (admin.password === password) {
          isPasswordValid = true;
          // Hash the password and save it for future logins
          const salt = await bcrypt.genSalt(10);
          admin.password = await bcrypt.hash(password, salt);
          await admin.save();
        }
      }

      if (!isPasswordValid) {
        return res.status(401).json({
          message: 'Invalid email or password'
        });
      }

      // Update last login
      admin.lastLogin = new Date();
      await admin.save();

      // Remove password from response
      const adminResponse = admin.toObject();
      delete adminResponse.password;

      return res.json({
        message: 'Admin login successful',
        user: adminResponse,
        role: 'admin'
      });
    }

    // If not admin, check for regular user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      message: 'Login successful',
      user: userResponse,
      role: 'user'
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

    let otp;
    try {
      otp = crypto.randomInt(100000, 999999).toString();
    } catch (otpError) {
      console.error('OTP generation error:', otpError);
      return res.status(500).json({
        message: 'Failed to generate OTP. Please try again.'
      });
    }

    try {
      otpStore.set(normalizedEmail, {
        otp,
        expiresAt: Date.now() + 5 * 60 * 1000
      });
    } catch (storeError) {
      console.error('OTP storage error:', storeError);
      return res.status(500).json({
        message: 'Failed to process OTP request. Please try again.'
      });
    }

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

    let emailResult;
    try {
      emailResult = await transporter.sendMail(mailOptions);
      console.log(`OTP sent successfully to ${normalizedEmail}. MessageId: ${emailResult.messageId}`);
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
        statusCode = 500;
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

    res.status(200).json({
      message: 'OTP sent successfully to your email'
    });

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

    const storedOtpData = otpStore.get(email.toLowerCase());

    if (!storedOtpData) {
      return res.status(400).json({
        message: 'OTP not found or expired. Please request a new OTP.'
      });
    }

    if (Date.now() > storedOtpData.expiresAt) {
      otpStore.delete(email.toLowerCase());
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
      otpStore.set(email.toLowerCase(), {
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
    otpStore.delete(email.toLowerCase());

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

    const storedData = otpStore.get(email.toLowerCase());

    if (!storedData || !storedData.resetToken || storedData.resetToken !== resetToken) {
      return res.status(400).json({ message: 'Invalid or expired reset session. Please try again.' });
    }

    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(email.toLowerCase());
      return res.status(400).json({ message: 'Session expired. Please try again.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password = newPassword;
    await user.save();

    otpStore.delete(email.toLowerCase());
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reset password', error: error.message });
  }
});

// Get all users (Employees)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
});

// Update user status (soft delete/active-inactive)
router.patch('/users/:id/status', async (req, res) => {
  try {
    const { active_inactive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { active_inactive },
      { new: true, runValidators: true }
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User status updated successfully', user });
  } catch (error) {
    res.status(400).json({ message: 'Failed to update status', error: error.message });
  }
});

// Update user details
router.put('/users/:id', async (req, res) => {
  try {
    const updates = req.body;
    // Don't allow password updates through this route
    delete updates.password;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    res.status(400).json({ message: 'Update failed', error: error.message });
  }
});

module.exports = router;
