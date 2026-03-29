const { getExecutor } = require("./helpers");

async function findByEmail(email, executor) {
  const db = getExecutor(executor);
  const result = await db.query(
    `
      SELECT id, name, email, password_hash, role, created_at, updated_at
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
    `,
    [email]
  );

  return result.rows[0] || null;
}

async function findById(id, executor) {
  const db = getExecutor(executor);
  const result = await db.query(
    `
      SELECT id, name, email, password_hash, role, created_at, updated_at
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );

  return result.rows[0] || null;
}

async function createUser(user, executor) {
  const db = getExecutor(executor);
  const result = await db.query(
    `
      INSERT INTO users (name, email, password_hash, role, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING id, name, email, role, created_at, updated_at
    `,
    [user.name, user.email, user.passwordHash, user.role]
  );

  return result.rows[0];
}

async function listUsers(executor) {
  const db = getExecutor(executor);
  const result = await db.query(`
    SELECT
      u.id,
      u.name,
      u.email,
      u.role,
      u.created_at,
      COUNT(pj.id) FILTER (WHERE pj.verified = TRUE) AS verified_journey_count,
      MAX(pj.verified_at) AS last_verified_at
    FROM users u
    LEFT JOIN passenger_journeys pj ON pj.user_id = u.id
    GROUP BY u.id
    ORDER BY u.role DESC, u.created_at DESC
  `);

  return result.rows;
}

module.exports = {
  createUser,
  findByEmail,
  findById,
  listUsers
};
