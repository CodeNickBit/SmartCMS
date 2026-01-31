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

    // 1. Check User/Employee FIRST (most common)
    const emp = await User.findOne({ email: emailRegex });
    console.log('Employee found:', !!emp);
    if (emp) {
      if (emp.active_inactive === false) return res.status(401).json({ message: 'Account deactivated' });
      if (await emp.comparePassword(password)) {
        user = emp;
        role = 'employee';
      }
    }

    // 2. Check Admin (if not found yet)
    if (!user) {
      const admin = await Admin.findOne({ email: emailRegex });
      console.log('Admin found:', !!admin);
      if (admin) {
        if (!admin.isActive) return res.status(401).json({ message: 'Account deactivated' });

        let isValid = false;
        const isHashed = admin.password.startsWith('$2a') || admin.password.startsWith('$2b') || admin.password.startsWith('$2y');
        if (isHashed) {
          isValid = await admin.comparePassword(password);
        } else if (admin.password === password) {
          isValid = true;
        }

        if (isValid) {
          user = admin;
          role = admin.role;
        }
      }
    }

    // 3. Check HR (if not found yet)
    if (!user) {
      const Hr = require('../models/Hr');
      const hr = await Hr.findOne({ email: emailRegex });
      console.log('HR found:', !!hr);
      if (hr) {
        if (!hr.isActive) return res.status(401).json({ message: 'Account deactivated' });
        if (await hr.comparePassword(password)) {
          user = hr;
          role = 'hr';
        }
      }
    }

    // 4. Check Manager (if not found yet)
    if (!user) {
      const Manager = require('../models/Manager');
      const manager = await Manager.findOne({ email: emailRegex });
      console.log('Manager found:', !!manager);
      if (manager) {
        if (!manager.isActive) return res.status(401).json({ message: 'Account deactivated' });
        if (await manager.comparePassword(password)) {
          user = manager;
          role = 'manager';
        }
      }
    }

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    const lastLogin = new Date();
    if (user.constructor && user.constructor.findByIdAndUpdate) {
      await user.constructor.findByIdAndUpdate(user._id, { lastLogin });
    }
    user.lastLogin = lastLogin;

    const userResponse = user.toObject();
    delete userResponse.password;
    if (userResponse.temporaryPassword) delete userResponse.temporaryPassword;

    const token = jwt.sign(
      { id: user._id, email: user.email, role: role },
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
