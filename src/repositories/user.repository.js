const { query } = require('../database/query');

async function create({ email, passwordHash, name }) {
  const result = await query(
    `INSERT INTO users (email, password_hash, name)
     VALUES ($1, $2, $3)
     RETURNING id, email, name, is_active, created_at, updated_at`,
    [email, passwordHash, name]
  );

  return result.rows[0];
}

async function findById(id) {
  const result = await query(
    `SELECT id, email, name, is_active, created_at, updated_at
     FROM users
     WHERE id = $1`,
    [id]
  );

  return result.rows[0] || null;
}

async function findByEmail(email) {
  const result = await query(
    `SELECT id, email, password_hash, name, is_active, created_at, updated_at
     FROM users
     WHERE email = $1`,
    [email]
  );

  return result.rows[0] || null;
}

async function updateById(id, { name, isActive }) {
  const result = await query(
    `UPDATE users
     SET name = COALESCE($2, name),
         is_active = COALESCE($3, is_active),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING id, email, name, is_active, created_at, updated_at`,
    [id, name ?? null, isActive ?? null]
  );

  return result.rows[0] || null;
}

async function deleteById(id) {
  const result = await query(
    'DELETE FROM users WHERE id = $1 RETURNING id',
    [id]
  );

  return result.rowCount > 0;
}

module.exports = {
  create,
  findById,
  findByEmail,
  updateById,
  deleteById
};
