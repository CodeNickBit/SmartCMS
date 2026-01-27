const express = require('express');
const router = express.Router();
const Hr = require('../models/Hr');

// Add a new HR
router.post('/add', async (req, res) => {
    try {
        const { name, email, password, department, permissions } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Check if HR already exists
        const existingHr = await Hr.findOne({ email: email.toLowerCase() });
        if (existingHr) {
            return res.status(400).json({ message: 'HR with this email already exists' });
        }

        const hr = new Hr({
            name,
            email: email.toLowerCase(),
            password,
            department,
            permissions: permissions || {
                canRegisterEmployees: true,
                canApproveLeaves: true,
                canHandlePayroll: true
            }
        });

        await hr.save();

        res.status(201).json({
            message: 'HR added successfully',
            hr: {
                id: hr._id,
                name: hr.name,
                email: hr.email,
                department: hr.department
            }
        });
    } catch (error) {
        console.error('HR addition error:', error);
        res.status(500).json({
            message: 'Failed to add HR',
            error: error.message
        });
    }
});

// Get all active HRs
router.get('/', async (req, res) => {
    try {
        const hrs = await Hr.find({ isActive: true }).select('-password');
        res.json(hrs);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch HRs', error: error.message });
    }
});

// Update HR
router.put('/:id', async (req, res) => {
    try {
        const { name, email, department, permissions } = req.body;
        const hr = await Hr.findById(req.params.id);

        if (!hr) {
            return res.status(404).json({ message: 'HR not found' });
        }

        if (name) hr.name = name;
        if (email) hr.email = email.toLowerCase();
        if (department) hr.department = department;
        if (permissions) hr.permissions = { ...hr.permissions, ...permissions };

        await hr.save();

        res.json({
            message: 'HR updated successfully',
            hr: {
                id: hr._id,
                name: hr.name,
                email: hr.email,
                department: hr.department
            }
        });
    } catch (error) {
        console.error('HR update error:', error);
        res.status(500).json({
            message: 'Failed to update HR',
            error: error.message
        });
    }
});

// Soft delete HR
router.delete('/:id', async (req, res) => {
    try {
        const hr = await Hr.findById(req.params.id);

        if (!hr) {
            return res.status(404).json({ message: 'HR not found' });
        }

        hr.isActive = false;
        await hr.save();

        res.json({ message: 'HR deactivated successfully' });
    } catch (error) {
        console.error('HR deletion error:', error);
        res.status(500).json({
            message: 'Failed to deactivate HR',
            error: error.message
        });
    }
});

module.exports = router;
