const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');
const { protect, isHR } = require('../middleware/authMiddleware');

// My assets (for employee logged in)
router.get('/my-assets', protect, assetController.getAssetsByUser);

// Admin / HR routes
router.post('/', protect, isHR, assetController.createAsset);
router.get('/', protect, isHR, assetController.getAllAssets);
router.put('/:id', protect, isHR, assetController.updateAsset);
router.delete('/:id', protect, isHR, assetController.deleteAsset);
router.post('/:id/assign', protect, isHR, assetController.assignAsset);
router.post('/:id/return', protect, isHR, assetController.returnAsset);

// Admin can fetch specific user's assets
router.get('/user/:userId', assetController.getAssetsByUser);

module.exports = router;
