const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/database/pool');
const userService = require('../src/services/user.service');
const { signToken } = require('../src/utils/token');

test('GET /api/auth/me rejects token for deleted user', async () => {
  const email = `deleted-${Date.now()}@example.com`;

  const user = await userService.createUser({
    email,
    name: 'Deleted User',
    passwordHash: 'test-hash'
  });

  const token = signToken(user);

  await pool.query('DELETE FROM users WHERE id = $1', [user.id]);

  const response = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 401);
});

test('GET /api/auth/me rejects token for inactive user', async (t) => {
  const email = `inactive-${Date.now()}@example.com`;

  const user = await userService.createUser({
    email,
    name: 'Inactive User',
    passwordHash: 'test-hash'
  });

  t.after(async () => {
    await pool.query('DELETE FROM users WHERE id = $1', [user.id]);
  });

  const columns = await pool.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_name = 'users'
       AND column_name = 'is_active'`
  );

  if (columns.rowCount === 0) {
    t.skip('users table has no is_active column');
    return;
  }

  await pool.query(
    'UPDATE users SET is_active = false WHERE id = $1',
    [user.id]
  );

  const token = signToken(user);

  const response = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 401);
});

test('GET /api/auth/me rejects empty Bearer token', async () => {
  const response = await request(app)
    .get('/api/auth/me')
    .set('Authorization', 'Bearer ');

  assert.equal(response.status, 401);
});

test.after(async () => {
  await pool.end();
});
