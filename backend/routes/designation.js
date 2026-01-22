const express = require('express');
const router = express.Router();
const Designation = require('../models/Designation');

// Create a new designation
router.post('/', async (req, res) => {
  try {
    const { title, description } = req.body;
    
    const existingDesig = await Designation.findOne({ title: title.trim() });
    if (existingDesig) {
      return res.status(400).json({ message: 'Designation already exists' });
    }

    const designation = new Designation({ title, description });
    await designation.save();
    res.status(201).json({ message: 'Designation created successfully', designation });
  } catch (error) {
    res.status(500).json({ message: 'Error creating designation', error: error.message });
  }
});

// Get all active designations
router.get('/', async (req, res) => {
  try {
    const designations = await Designation.find({ isActive: true });
    res.json(designations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching designations', error: error.message });
  }
});

// Update a designation
router.put('/:id', async (req, res) => {
  try {
    const { title, description } = req.body;
    const designation = await Designation.findByIdAndUpdate(
      req.params.id,
      { title, description },
      { new: true }
    );
    if (!designation) return res.status(404).json({ message: 'Designation not found' });
    res.json({ message: 'Designation updated successfully', designation });
  } catch (error) {
    res.status(500).json({ message: 'Error updating designation', error: error.message });
  }
});

// Soft delete a designation
router.delete('/:id', async (req, res) => {
  try {
    const designation = await Designation.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!designation) return res.status(404).json({ message: 'Designation not found' });
    res.json({ message: 'Designation deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting designation', error: error.message });
  }
});

module.exports = router;
