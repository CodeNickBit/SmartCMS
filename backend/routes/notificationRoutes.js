const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Notification = require('../models/Notification');

// GET all notifications for the authenticated user
router.get('/', protect, async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const notifications = await Notification.find({ user: userId })
                                                .sort({ createdAt: -1 })
                                                .limit(100); // Only return latest 100 to save bandwidth
        res.json(notifications);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching notifications' });
    }
});

// PUT mark an individual notification as read
router.put('/:id/read', protect, async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const notification = await Notification.findOne({ _id: req.params.id, user: userId });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        notification.isRead = true;
        await notification.save();

        res.json({ message: 'Notification marked as read', notification });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error updating notification status' });
    }
});

// PUT mark all user notifications as read
router.put('/read-all', protect, async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        
        await Notification.updateMany(
            { user: userId, isRead: false },
            { $set: { isRead: true } }
        );

        res.json({ message: 'All notifications marked as read' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error marking all as read' });
    }
});

// DELETE an individual notification
router.delete('/:id', protect, async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const notification = await Notification.findOneAndDelete({ _id: req.params.id, user: userId });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json({ message: 'Notification deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error deleting notification' });
    }
});

module.exports = router;
