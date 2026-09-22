const Notification = require('../models/Notification');

function serializeNotification(n) {
  return {
    id: n._id,
    type: n.type,
    read: n.read,
    createdAt: n.createdAt,
    post: n.post || undefined,
    actor: n.actor && {
      id: n.actor._id,
      displayName: n.actor.displayName,
      username: n.actor.username,
      avatarUrl: n.actor.avatarUrl,
    },
  };
}

// GET /api/notifications?page=1&limit=20
async function getNotifications(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('actor', 'displayName username avatarUrl');

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    });

    res.json({
      notifications: notifications.map(serializeNotification),
      unreadCount,
      page,
      hasMore: notifications.length === limit,
    });
  } catch (err) {
    res.status(500).json({ message: 'Could not load notifications', error: err.message });
  }
}

// PATCH /api/notifications/:id/read
async function markAsRead(req, res) {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { read: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json({ notification: serializeNotification(notification) });
  } catch (err) {
    res.status(500).json({ message: 'Could not update notification', error: err.message });
  }
}

// PATCH /api/notifications/read-all
async function markAllAsRead(req, res) {
  try {
    await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Could not update notifications', error: err.message });
  }
}

module.exports = { getNotifications, markAsRead, markAllAsRead };
