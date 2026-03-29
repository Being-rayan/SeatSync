const { getExecutor, toJson } = require("./helpers");

async function logAction(entry, executor) {
  const db = getExecutor(executor);

  await db.query(
    `
      INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details_json, created_at)
      VALUES ($1, $2, $3, $4, $5::jsonb, NOW())
    `,
    [
      entry.actorUserId || null,
      entry.action,
      entry.entityType,
      entry.entityId,
      toJson(entry.details)
    ]
  );
}

module.exports = {
  logAction
};
