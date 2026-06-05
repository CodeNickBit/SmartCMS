exports.register = async (req, res) => {
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
    
    workflowService.triggerOnboarding(user).catch(err => console.error('Workflow trigger error:', err));
    
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
};
