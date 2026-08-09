const Asset = require('../models/Asset');
const User = require('../models/User');
const CompanySettings = require('../models/CompanySettings');

// Get all assets
exports.getAllAssets = async (req, res) => {
    try {
        const query = {};
        if (req.query.status) query.status = req.query.status;
        if (req.query.assignedTo) query.assignedTo = req.query.assignedTo;

        const assets = await Asset.find(query).populate('assignedTo', 'firstName lastName _id email');
        res.json(assets);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching assets', error: error.message });
    }
};

// Get asset by ID
exports.getAssetById = async (req, res) => {
    try {
        const asset = await Asset.findById(req.params.id).populate('assignedTo', 'firstName lastName _id email');
        if (!asset) return res.status(404).json({ message: 'Asset not found' });
        res.json(asset);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching asset', error: error.message });
    }
};

// Create new asset
exports.createAsset = async (req, res) => {
    try {
        const { name, serialNumber, category, status, purchaseDate, purchaseCost, notes } = req.body;
        
        // Ensure category exists or save it dynamically if needed? (We will rely on frontend passing the string)
        const newAsset = new Asset({
            name,
            serialNumber,
            category,
            status: status || 'Available',
            purchaseDate,
            purchaseCost,
            notes
        });

        const savedAsset = await newAsset.save();
        res.status(201).json(savedAsset);
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ message: 'Serial number must be unique' });
        res.status(500).json({ message: 'Server error creating asset', error: error.message });
    }
};

// Update asset
exports.updateAsset = async (req, res) => {
    try {
        const asset = await Asset.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!asset) return res.status(404).json({ message: 'Asset not found' });
        res.json(asset);
    } catch (error) {
        res.status(500).json({ message: 'Server error updating asset', error: error.message });
    }
};

// Delete asset
exports.deleteAsset = async (req, res) => {
    try {
        const asset = await Asset.findByIdAndDelete(req.params.id);
        if (!asset) return res.status(404).json({ message: 'Asset not found' });
        res.json({ message: 'Asset deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error deleting asset', error: error.message });
    }
};

// Assign asset to user
exports.assignAsset = async (req, res) => {
    try {
        const { assignedTo } = req.body;
        const user = await User.findById(assignedTo);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const asset = await Asset.findById(req.params.id);
        if (!asset) return res.status(404).json({ message: 'Asset not found' });
        if (asset.status === 'Assigned') return res.status(400).json({ message: 'Asset is already assigned' });

        asset.assignedTo = assignedTo;
        asset.status = 'Assigned';
        asset.assignmentDate = new Date();
        asset.returnDate = null;
        
        await asset.save();
        res.json({ message: 'Asset assigned successfully', asset });
    } catch (error) {
        res.status(500).json({ message: 'Server error assigning asset', error: error.message });
    }
};

// Return asset
exports.returnAsset = async (req, res) => {
    try {
        const { notes } = req.body;
        const asset = await Asset.findById(req.params.id);
        if (!asset) return res.status(404).json({ message: 'Asset not found' });
        if (asset.status !== 'Assigned') return res.status(400).json({ message: 'Asset is not currently assigned' });

        asset.assignedTo = null;
        asset.status = 'Available';
        asset.returnDate = new Date();
        if (notes) asset.notes = notes;

        await asset.save();
        res.json({ message: 'Asset returned successfully', asset });
    } catch (error) {
        res.status(500).json({ message: 'Server error returning asset', error: error.message });
    }
};

// Get assets assigned to specific user
exports.getAssetsByUser = async (req, res) => {
    try {
        const userId = req.params.userId || req.user._id; // If specific userId is not provided, use logged in user
        const assets = await Asset.find({ assignedTo: userId });
        res.json(assets);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching user assets', error: error.message });
    }
};
