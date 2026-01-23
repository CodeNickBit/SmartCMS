const express = require('express');
const router = express.Router();
const Department = require('../models/Department');

// Create a new department
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const existingDept = await Department.findOne({ name: name.trim() });
    if (existingDept) {
      return res.status(400).json({ message: 'Department already exists' });
    }

    const department = new Department({ name, description });
    await department.save();
    res.status(201).json({ message: 'Department created successfully', department });
  } catch (error) {
    res.status(500).json({ message: 'Error creating department', error: error.message });
  }
});

// Get all active departments
router.get('/', async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true });
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching departments', error: error.message });
  }
});

// Update a department
router.put('/:id', async (req, res) => {
  try {
    const { name, description } = req.body;
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { name, description },
      { new: true }
    );
    if (!department) return res.status(404).json({ message: 'Department not found' });
    res.json({ message: 'Department updated successfully', department });
  } catch (error) {
    res.status(500).json({ message: 'Error updating department', error: error.message });
  }
});

// Soft delete a department
router.delete('/:id', async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!department) return res.status(404).json({ message: 'Department not found' });
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting department', error: error.message });
  }
});

module.exports = router;
