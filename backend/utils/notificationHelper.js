const Notification = require('../models/Notification');
const User = require('../models/User');
const Hr = require('../models/Hr');

/**
 * Helper utility to create a new notification
 *
 * @param {String} userId - The ID of the user receiving the notification
 * @param {String} title - Bold notification heading
 * @param {String} message - The body of the notification
 * @param {String} category - Event enum ('Task', 'Leave', 'Attendance', 'Payroll', 'System', 'General')
 * @param {String} relatedId - Optional ID of the context model (Task ID, etc.)
 */
const createNotification = async (userId, title, message, category = 'General', relatedId = null) => {
    try {
        if (!userId) return null; // Fallback if no user is provided

        const newNotification = new Notification({
            user: userId,
            title,
            message,
            category,
            relatedId
        });

        await newNotification.save();
        return newNotification;
    } catch (err) {
        console.error('Error creating notification:', err.message);
        return null;
    }
}

/**
 * Notify all HR users
 */
const notifyHRs = async (title, message, category = 'General', relatedId = null) => {
    try {
        // Find HRs from both Hr collection and User collection (with HR role)
        const hrs = await Hr.find({ isActive: true }).select('_id');
        const hrUsers = await User.find({ role: 'hr', active_inactive: true }).select('_id');
        
        const allHrIds = [...new Set([
            ...hrs.map(h => String(h._id)),
            ...hrUsers.map(u => String(u._id))
        ])];

        const notifications = await Promise.all(allHrIds.map(id => 
            createNotification(id, title, message, category, relatedId)
        ));

        return notifications;
    } catch (err) {
        console.error('Error notifying HRs:', err.message);
        return [];
    }
}

module.exports = {
    createNotification,
    notifyHRs
};

