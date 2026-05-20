const Notification = require('../models/Notification');

/**
 * Create a notification and emit it via Socket.io
 * @param {Object} options
 * @param {string} options.recipient - User ID to receive notification
 * @param {string} [options.sender] - User ID who triggered it (null for system)
 * @param {string} options.type - Notification type
 * @param {string} options.title - Notification title
 * @param {string} options.body - Notification body text
 * @param {string} [options.entityId] - Related entity ID
 * @param {string} [options.entityModel] - Related entity model name
 * @param {string} [options.link] - Frontend navigation link
 * @param {Object} [options.io] - Socket.io server instance
 */
async function createNotification({ recipient, sender, type, title, body, entityId, entityModel, link, io }) {
  try {
    const notification = await Notification.create({
      recipient,
      sender: sender || undefined,
      type,
      title,
      body,
      entityId: entityId || undefined,
      entityModel: entityModel || undefined,
      link: link || '',
    });

    await notification.populate('sender', 'name avatar');

    // Emit real-time notification via Socket.io
    if (io && io.sendToUser) {
      io.sendToUser(recipient, 'new_notification', notification);
    }

    return notification;
  } catch (err) {
    console.error('Failed to create notification:', err.message);
    return null;
  }
}

module.exports = { createNotification };
