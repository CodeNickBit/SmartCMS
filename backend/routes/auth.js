const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Admin = require('../models/Admin');
const Manager = require('../models/Manager');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/authMiddleware');

const otpStore = new Map();

function createTransporter() {
  const emailUser = (process.env.EMAIL_USER || 'ankbizzcorp@gmail.com').trim();
  const emailPassword = process.env.EMAIL_PASSWORD
    ? process.env.EMAIL_PASSWORD.trim().replace(/\s+/g, '')
    : '';
  if (!emailPassword) throw new Error('Email configuration error: EMAIL_PASSWORD is required');
  return nodemailer.createTransport({ service: 'gmail', auth: { user: emailUser, pass: emailPassword } });
}

router.post('/register', async (req, res) => {
  try {
    const {
      firstName, middleName, lastName, gender, dateOfBirth, maritalStatus,
      phone, email, currentAddress, permanentAddress, emergencyContactName, emergencyContactNumber,
      fatherGuardianName, guardianContact, spouseName, spouseContactNumber, marriageDate,
      preferredName, pronouns,
      employeeId, department, designation, reportingManager, joiningDate, employmentType,
      workLocation, shiftType,
      workingHoursStart, workingHoursEnd, weeklyWorkingDays, wageType, salaryAmount,
      allowances, overtimeEligible, bankAccountNumber, bankName, bankIFSC,
      pfApplicable, esicApplicable, maternityEligible, flexibleWorkingHours,
      pregnancyStatus, expectedDeliveryDate, medicalFitnessCertificate, password
    } = req.body;

    const normalizedEmail = email.trim().toLowerCase();
    const effectiveEmployeeId = (employeeId === 'TO BE GENERATED' || !employeeId)
      ? undefined : employeeId.trim().toUpperCase();

    const existingUser = await User.findOne({
      $or: [
        { email: normalizedEmail },
        ...(effectiveEmployeeId ? [{ employeeId: effectiveEmployeeId }] : [])
      ]
    });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email or employee ID' });
    }

    const autoMaternityEligible = gender === 'Female' && maritalStatus === 'Married';

    const user = new User({
      firstName, middleName: middleName || undefined, lastName, gender,
      dateOfBirth: dateOfBirth || undefined, maritalStatus: maritalStatus || undefined,
      phone, email: normalizedEmail, currentAddress, permanentAddress,
      emergencyContactName, emergencyContactNumber,
      fatherGuardianName: (gender === 'Female' && maritalStatus === 'Single') ? fatherGuardianName : undefined,
      guardianContact: (gender === 'Female' && maritalStatus === 'Single') ? guardianContact : undefined,
      spouseName: (gender === 'Female' && maritalStatus === 'Married') ? spouseName : undefined,
      spouseContactNumber: (gender === 'Female' && maritalStatus === 'Married') ? spouseContactNumber : undefined,
      marriageDate: (gender === 'Female' && maritalStatus === 'Married') ? (marriageDate || undefined) : undefined,
      preferredName: (gender === 'Other') ? preferredName : undefined,
      pronouns: (gender === 'Other') ? pronouns : undefined,
      employeeId: effectiveEmployeeId,
      department, designation,
      joiningDate: joiningDate || undefined, employmentType, workLocation,
      shiftType: shiftType || undefined,
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
      maternityEligible: maternityEligible !== undefined ? maternityEligible : autoMaternityEligible,
      flexibleWorkingHours: flexibleWorkingHours || false,
      pregnancyStatus: pregnancyStatus || 'Not Pregnant',
      expectedDeliveryDate: expectedDeliveryDate || undefined,
      medicalFitnessCertificate: medicalFitnessCertificate || undefined,
      password
    });

    if (!user.employeeId) user.employeeId = user._id;

    if (reportingManager && String(reportingManager).trim()) {
      const rm = String(reportingManager).trim();
      let manager = null;
      if (/^[0-9a-fA-F]{24}$/.test(rm)) {
        manager = await Manager.findById(rm);
      }
      if (!manager) {
        manager = await Manager.findOne({ email: rm.toLowerCase() });
      }
      if (manager) {
        user.reportingManager = manager._id;
      } else {
        return res.status(400).json({ message: 'Reporting manager not found. Please select a valid manager from the list.' });
      }
    }

    await user.save();
    const userResponse = user.toObject();
    delete userResponse.password;
    res.status(201).json({ message: 'User registered successfully', user: userResponse });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'User already exists with this email or employee ID' });
    }
    console.error('Registration error:', error);
    res.status(400).json({ message: 'Registration failed', error: error.message });
  }
});

router.post('/register-admin', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    const existingAdmin = await Admin.findOne({ email: normalizedEmail });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin already exists with this email' });
    }
    const admin = new Admin({ name, email: normalizedEmail, password, role: role || 'admin' });
    await admin.save();
    res.status(201).json({
      message: 'Admin registered successfully',
      admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role }
    });
  } catch (error) {
    res.status(500).json({ message: 'Admin registration failed', error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const normalizedEmail = email.trim().toLowerCase();

    let user = null;
    let role = null;

    const emp = await User.findOne({ email: normalizedEmail }).populate('reportingManager', 'name firstName lastName department');
    if (emp) {
      if (emp.active_inactive === false) return res.status(401).json({ message: 'Account deactivated' });
      if (await emp.comparePassword(password)) { user = emp; role = 'employee'; }
    }

    if (!user) {
      const admin = await Admin.findOne({ email: normalizedEmail });
      if (admin) {
        if (!admin.isActive) return res.status(401).json({ message: 'Account deactivated' });
        const isHashed = admin.password.startsWith('$2');
        const isValid = isHashed ? await admin.comparePassword(password) : admin.password === password;
        if (isValid) { user = admin; role = admin.role; }
      }
    }

    if (!user) {
      const Hr = require('../models/Hr');
      const hr = await Hr.findOne({ email: normalizedEmail });
      if (hr) {
        if (!hr.isActive) return res.status(401).json({ message: 'Account deactivated' });
        if (await hr.comparePassword(password)) { user = hr; role = 'hr'; }
      }
    }

    if (!user) {
      const manager = await Manager.findOne({ email: normalizedEmail });
      if (manager) {
        if (!manager.isActive) return res.status(401).json({ message: 'Account deactivated' });
        if (await manager.comparePassword(password)) { user = manager; role = 'manager'; }
      }
    }

    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    if (user.constructor && user.constructor.findByIdAndUpdate) {
      await user.constructor.findByIdAndUpdate(user._id, { lastLogin: new Date() });
    }

    const userResponse = user.toObject ? user.toObject() : { ...user };
    delete userResponse.password;
    if (userResponse.temporaryPassword) delete userResponse.temporaryPassword;

    const token = jwt.sign(
      { id: user._id, email: user.email, role, name: user.name || `${user.firstName} ${user.lastName}` },
      process.env.JWT_SECRET || 'secret_key_change_this_in_production',
      { expiresIn: '24h' }
    );

    res.json({ message: 'Login successful', user: userResponse, token, role });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) return res.status(400).json({ message: 'Please provide a valid email address' });
    const normalizedEmail = email.trim().toLowerCase();

    let transporter;
    try { transporter = createTransporter(); } catch (e) {
      return res.status(500).json({ message: 'Email service configuration error.' });
    }
    try { await transporter.verify(); } catch (e) {
      return res.status(500).json({ message: 'Email service is not available.' });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    otpStore.set(normalizedEmail, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });

    const emailUser = (process.env.EMAIL_USER || 'ankbizzcorp@gmail.com').trim();
    const mailOptions = {
      from: emailUser, to: normalizedEmail,
      subject: 'Email Verification - SmartCMS',
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto"><h2 style="color:#3083DC">Email Verification</h2><p>Your verification code is:</p><h1 style="color:#3083DC;font-size:32px;letter-spacing:8px;text-align:center;padding:20px;background:#f0f0f0;border-radius:8px">${otp}</h1><p>This code will expire in 5 minutes.</p></div>`
    };

    try {
      await transporter.sendMail(mailOptions);
      res.status(200).json({ message: 'OTP sent successfully to your email' });
    } catch (emailError) {
      otpStore.delete(normalizedEmail);
      let msg = 'Failed to send OTP. Please try again.';
      let code = 500;
      if (emailError.code === 'EAUTH') { msg = 'Email authentication failed.'; }
      else if (emailError.code === 'ECONNECTION' || emailError.code === 'ETIMEDOUT') { msg = 'Could not connect to email server.'; code = 503; }
      else if (emailError.code === 'EENVELOPE') { msg = 'Invalid email address.'; code = 400; }
      return res.status(code).json({ message: msg });
    }
  } catch (error) {
    res.status(500).json({ message: 'Internal server error during OTP process.' });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, isPasswordReset } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });
    const normalizedEmail = email.toLowerCase();
    const storedOtpData = otpStore.get(normalizedEmail);
    if (!storedOtpData) return res.status(400).json({ message: 'OTP not found or expired.' });
    if (Date.now() > storedOtpData.expiresAt) {
      otpStore.delete(normalizedEmail);
      return res.status(400).json({ message: 'OTP has expired.' });
    }
    if (storedOtpData.otp !== otp) return res.status(400).json({ message: 'Invalid OTP.' });

    if (isPasswordReset) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      otpStore.set(normalizedEmail, { resetToken, expiresAt: Date.now() + 5 * 60 * 1000 });
      return res.json({ message: 'OTP verified', verified: true, resetToken });
    }
    otpStore.delete(normalizedEmail);
    res.json({ message: 'Email verified successfully', verified: true });
  } catch (error) {
    res.status(500).json({ message: 'Failed to verify OTP.', error: error.message });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword, resetToken } = req.body;
    if (!email || !newPassword || !resetToken) return res.status(400).json({ message: 'All fields are required' });
    const normalizedEmail = email.toLowerCase();
    const storedData = otpStore.get(normalizedEmail);
    if (!storedData || !storedData.resetToken || storedData.resetToken !== resetToken) {
      return res.status(400).json({ message: 'Invalid or expired reset session.' });
    }
    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(normalizedEmail);
      return res.status(400).json({ message: 'Session expired.' });
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

router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    delete updates.password;

    if (updates.reportingManager !== undefined) {
      if (!updates.reportingManager || !String(updates.reportingManager).trim()) {
        updates.reportingManager = null;
      } else {
        const rm = String(updates.reportingManager).trim();
        let manager = null;
        if (/^[0-9a-fA-F]{24}$/.test(rm)) manager = await Manager.findById(rm);
        if (!manager) manager = await Manager.findOne({ email: rm.toLowerCase() });
        if (manager) {
          updates.reportingManager = manager._id;
        } else {
          return res.status(400).json({ message: 'Reporting manager not found.' });
        }
      }
    }

    if (updates.backupManager !== undefined) {
      if (!updates.backupManager || !String(updates.backupManager).trim()) {
        updates.backupManager = null;
      } else {
        const bm = String(updates.backupManager).trim();
        let manager = null;
        if (/^[0-9a-fA-F]{24}$/.test(bm)) manager = await Manager.findById(bm);
        if (!manager) manager = await Manager.findOne({ email: bm.toLowerCase() });
        if (manager) {
          updates.backupManager = manager._id;
        } else {
          return res.status(400).json({ message: 'Backup manager not found.' });
        }
      }
    }

    const user = await User.findByIdAndUpdate(id, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user', error: error.message });
  }
});

router.patch('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user = await User.findByIdAndUpdate(id, { active_inactive: status }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user status', error: error.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
});

router.get('/my-team', protect, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const managerId = req.user._id || req.user.id;
    const teamMembers = await User.find({
      $or: [
        { reportingManager: managerId },
        { backupManager: managerId }
      ]
    }).select('-password').sort({ firstName: 1 });
    res.json(teamMembers);
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ message: 'Failed to fetch team members', error: error.message });
  }
});

router.get('/users/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    let user = await User.findById(id).select('-password').lean();
    if (user) {
      return res.json({ ...user, role: 'employee' });
    }
    
    // Fallback to checking other models if necessary, though mostly used for employees now
    const HrModel = require('../models/Hr');
    user = await HrModel.findById(id).select('-password').lean();
    if (user) return res.json({ ...user, role: 'hr' });

    user = await Manager.findById(id).select('-password').lean();
    if (user) return res.json({ ...user, role: 'manager' });

    user = await Admin.findById(id).select('-password').lean();
    if (user) return res.json({ ...user, role: 'admin' });

    return res.status(404).json({ message: 'User not found' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user details', error: error.message });
  }
});

router.get('/users', protect, async (req, res) => {
  try {
    const ManagerModel = require('../models/Manager');
    const AdminModel = require('../models/Admin');
    
    const [employees, managers, admins] = await Promise.all([
      User.find({}).select('_id firstName lastName email role employeeId department designation salaryTemplate salaryOverrides reportingManager backupManager active_inactive').lean(),
      ManagerModel.find({}).select('_id name email role department designation isActive').lean(),
      AdminModel.find({}).select('_id name email role').lean()
    ]);

    let HrModel;
    try { HrModel = require('../models/Hr'); } catch (e) { HrModel = null; }
    const hrs = HrModel ? await HrModel.find({}).select('_id name email role department isActive').lean() : [];

    const resolveManagerName = (managerRef) => {
      if (!managerRef) return null;
      const refString = String(managerRef).trim();
      if (!refString) return null;
      
      // Look up by exact ID first
      let found = managers.find(m => String(m._id) === refString);
      if (found) return found.name;
      
      // Fallback for corrupted data holding plain names directly (e.g. "Atik")
      found = managers.find(m => m.name.toLowerCase() === refString.toLowerCase());
      if (found) return found.name;
      
      return refString; // Give back the raw corrupted value so it's not invisible
    };

    const normalize = (u, role) => ({
      _id: String(u._id),
      name: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
      email: u.email,
      role: u.role || role,
      employeeId: u.employeeId || null,
      department: u.department || null,
      designation: u.designation || null,
      salaryTemplate: u.salaryTemplate || null,
      salaryOverrides: u.salaryOverrides || null,
      reportingManager: resolveManagerName(u.reportingManager),
      backupManager: resolveManagerName(u.backupManager),
      active_inactive: u.active_inactive ?? (u.isActive ?? true)
    });

    const result = [
      ...employees.map(u => normalize(u, 'employee')),
      ...managers.map(u => normalize(u, 'manager')),
      ...hrs.map(u => normalize(u, 'hr')),
      ...admins.map(u => normalize(u, 'admin'))
    ];

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users', error: err.message });
  }
});

module.exports = router;

