const Notification = require('../models/Notification');

/**
 * Creates a notification for `recipient`, unless they're the same person
 * as `actor` (e.g. liking your own post shouldn't notify you).
 */
async function notify({ recipient, actor, type, post = null }) {
  if (String(recipient) === String(actor)) return null;
  return Notification.create({ recipient, actor, type, post });
}

module.exports = notify;
