const LeavePolicy = require('../models/LeavePolicy');
const CompanySettings = require('../models/CompanySettings');

// Create a new leave policy
exports.createPolicy = async (req, res) => {
    try {
        const { leaveName, description, allowedRoles, annualLimit, minNoticeHours } = req.body;

        const existingPolicy = await LeavePolicy.findOne({ leaveName });
        if (existingPolicy) {
            return res.status(400).json({ message: 'Policy with this name already exists' });
        }

        const newPolicy = new LeavePolicy({
            leaveName,
            description,
            allowedRoles,
            annualLimit,
            minNoticeHours: minNoticeHours || 0
        });

        await newPolicy.save();
        res.status(201).json(newPolicy);
    } catch (error) {
        res.status(500).json({ message: 'Error creating policy', error: error.message });
    }
};

// Get all leave policies
exports.getAllPolicies = async (req, res) => {
    try {
        const policies = await LeavePolicy.find().sort({ createdAt: -1 });
        res.status(200).json(policies);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching policies', error: error.message });
    }
};

// Update a leave policy
exports.updatePolicy = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const updatedPolicy = await LeavePolicy.findByIdAndUpdate(id, updates, { new: true });

        if (!updatedPolicy) {
            return res.status(404).json({ message: 'Policy not found' });
        }

        res.status(200).json(updatedPolicy);
    } catch (error) {
        res.status(500).json({ message: 'Error updating policy', error: error.message });
    }
};

// Delete a leave policy
exports.deletePolicy = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedPolicy = await LeavePolicy.findByIdAndDelete(id);

        if (!deletedPolicy) {
            return res.status(404).json({ message: 'Policy not found' });
        }

        res.status(200).json({ message: 'Policy deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting policy', error: error.message });
    }
};

// --- Global Settings (General Rules) ---

// Get Company Settings (or create default if not exists)
exports.getSettings = async (req, res) => {
    try {
        let settings = await CompanySettings.findOne();

        if (!settings) {
            // Default "Strong" rules if none exist
            const defaultRules = [
                "Leaves cannot be clubbed with other types of leaves.",
                "Sandwich Rule: Holidays falling between two leave days will be counted as leave.",
                "Medical certificate is mandatory for Sick Leave exceeding 2 consecutive days.",
                "Unused Casual Leaves lapse at the end of the year and cannot be encashed.",
                "Leave application must be approved by the reporting manager."
            ];

            settings = new CompanySettings({ generalLeaveRules: defaultRules });
            await settings.save();
        }

        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching settings', error: error.message });
    }
};

// Update Company Settings
exports.updateSettings = async (req, res) => {
    try {
        const { generalLeaveRules } = req.body;

        // Find existing or create new (upsert-like behavior)
        let settings = await CompanySettings.findOne();

        if (settings) {
            settings.generalLeaveRules = generalLeaveRules;
            await settings.save();
        } else {
            settings = new CompanySettings({ generalLeaveRules });
            await settings.save();
        }

        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Error updating settings', error: error.message });
    }
};
