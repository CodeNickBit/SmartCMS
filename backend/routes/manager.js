const express = require('express');
const router = express.Router();
const Manager = require('../models/Manager');

// Register a new manager
router.post('/register', async (req, res) => {
  try {
    const { name, email, temporaryPassword, department, designation, joiningDate } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if manager already exists
    const existingManager = await Manager.findOne({ email: email.toLowerCase() });
    if (existingManager) {
      return res.status(400).json({ message: 'Manager with this email already exists' });
    }

    const manager = new Manager({
      name,
      email: email.toLowerCase(),
      temporaryPassword,
      department,
      designation,
      joiningDate: joiningDate || new Date()
    });

    await manager.save();

    res.status(201).json({
      message: 'Manager registered successfully',
      manager: {
        id: manager._id,
        name: manager.name,
        email: manager.email,
        department: manager.department,
        designation: manager.designation
      }
    });
  } catch (error) {
    console.error('Manager registration error:', error);
    res.status(500).json({
      message: 'Failed to register manager',
      error: error.message
    });
  }
});

// Get all managers
router.get('/', async (req, res) => {
  try {
    const managers = await Manager.find({ isActive: true }).select('-temporaryPassword');
    res.json(managers);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch managers', error: error.message });
  }
});

// Update manager
router.put('/:id', async (req, res) => {
  try {
    const { email, department, designation } = req.body;
    const manager = await Manager.findById(req.params.id);

    if (!manager) {
      return res.status(404).json({ message: 'Manager not found' });
    }

    if (email) manager.email = email.toLowerCase();
    if (department) manager.department = department;
    if (designation) manager.designation = designation;

    await manager.save();

    res.json({
      message: 'Manager updated successfully',
      manager: {
        id: manager._id,
        name: manager.name,
        email: manager.email,
        department: manager.department,
        designation: manager.designation
      }
    });
  } catch (error) {
    console.error('Manager update error:', error);
    res.status(500).json({
      message: 'Failed to update manager',
      error: error.message
    });
  }
});

// Soft delete manager
router.delete('/:id', async (req, res) => {
  try {
    const manager = await Manager.findById(req.params.id);

    if (!manager) {
      return res.status(404).json({ message: 'Manager not found' });
    }

    manager.isActive = false;
    await manager.save();

    res.json({ message: 'Manager deactivated successfully' });
  } catch (error) {
    console.error('Manager deletion error:', error);
    res.status(500).json({
      message: 'Failed to deactivate manager',
      error: error.message
    });
  }
});

module.exports = router;
