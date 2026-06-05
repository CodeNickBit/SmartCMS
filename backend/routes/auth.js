const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/register-admin', authController.registerAdmin);
router.post('/login', authController.login);
router.post('/send-otp', authController.sendOtp);
router.post('/verify-otp', authController.verifyOtp);
router.post('/reset-password', authController.resetPassword);
router.put('/users/:id', authController.updateUser);
router.patch('/users/:id/status', authController.updateUserStatus);
router.delete('/users/:id', authController.deleteUser);
router.get('/my-team', protect, authController.getMyTeam);
router.get('/users/:id', protect, authController.getUserById);
router.get('/users', protect, authController.getUsers);

module.exports = router;
