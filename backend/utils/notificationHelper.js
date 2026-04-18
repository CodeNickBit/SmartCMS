const Notification = require('../models/Notification');

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

module.exports = {
    createNotification
};
