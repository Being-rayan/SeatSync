const { getExecutor, toJson } = require("./helpers");

async function createNotification(notification, executor) {
  const db = getExecutor(executor);
  const result = await db.query(
    `
      INSERT INTO notifications (user_id, type, title, body, is_read, meta_json, created_at)
      VALUES ($1, $2, $3, $4, FALSE, $5::jsonb, NOW())
      RETURNING id, user_id, type, title, body, is_read, meta_json, created_at
    `,
    [
      notification.userId,
      notification.type,
      notification.title,
      notification.body,
      toJson(notification.meta)
    ]
  );

  return result.rows[0];
}

async function createNotifications(notifications, executor) {
  const results = [];

  for (const notification of notifications) {
    results.push(await createNotification(notification, executor));
  }

  return results;
}

async function listByUser(userId, executor) {
  const db = getExecutor(executor);
  const result = await db.query(
    `
      SELECT id, user_id, type, title, body, is_read, meta_json, created_at
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 100
    `,
    [userId]
  );

  return result.rows;
}

async function markRead(userId, notificationId, executor) {
  const db = getExecutor(executor);
  const result = await db.query(
    `
      UPDATE notifications
      SET is_read = TRUE
      WHERE id = $1 AND user_id = $2
      RETURNING id, user_id, type, title, body, is_read, meta_json, created_at
    `,
    [notificationId, userId]
  );

  return result.rows[0] || null;
}

module.exports = {
  createNotification,
  createNotifications,
  listByUser,
  markRead
};
