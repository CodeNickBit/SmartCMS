const express = require('express');
const router = express.Router();
const OfficeLocation = require('../models/OfficeLocation');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');

router.post('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, address, latitude, longitude, radius, isActive, timezone } = req.body;

    if (!name || !address || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: 'Name, address, latitude, and longitude are required' });
    }

    const officeLocation = new OfficeLocation({
      name,
      address,
      latitude,
      longitude,
      radius: radius || 100,
      isActive: isActive !== undefined ? isActive : true,
      timezone: timezone || 'Asia/Kolkata',
      createdBy: req.user.id
    });

    await officeLocation.save();
    res.status(201).json({ message: 'Office location created successfully', location: officeLocation });
  } catch (error) {
    console.error('Error creating office location:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const locations = await OfficeLocation.find().sort({ createdAt: -1 });
    res.json(locations);
  } catch (error) {
    console.error('Error fetching office locations:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/active', authenticateToken, async (req, res) => {
  try {
    const locations = await OfficeLocation.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(locations);
  } catch (error) {
    console.error('Error fetching active office locations:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const location = await OfficeLocation.findById(req.params.id);
    if (!location) {
      return res.status(404).json({ message: 'Office location not found' });
    }
    res.json(location);
  } catch (error) {
    console.error('Error fetching office location:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, address, latitude, longitude, radius, isActive, timezone } = req.body;

    const location = await OfficeLocation.findById(req.params.id);
    if (!location) {
      return res.status(404).json({ message: 'Office location not found' });
    }

    if (name) location.name = name;
    if (address) location.address = address;
    if (latitude !== undefined) location.latitude = latitude;
    if (longitude !== undefined) location.longitude = longitude;
    if (radius !== undefined) location.radius = radius;
    if (isActive !== undefined) location.isActive = isActive;
    if (timezone) location.timezone = timezone;

    await location.save();
    res.json({ message: 'Office location updated successfully', location });
  } catch (error) {
    console.error('Error updating office location:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const location = await OfficeLocation.findByIdAndDelete(req.params.id);
    if (!location) {
      return res.status(404).json({ message: 'Office location not found' });
    }
    res.json({ message: 'Office location deleted successfully' });
  } catch (error) {
    console.error('Error deleting office location:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
