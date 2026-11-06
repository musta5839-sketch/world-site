const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { signToken } = require('../src/utils/token');
const userService = require('../src/services/user.service');
const pool = require('../src/database/pool');

test('GET /api/auth/me rejects missing token', async () => {
  const response = await request(app).get('/api/auth/me');
  assert.equal(response.status, 401);
});

test('GET /api/auth/me rejects malformed token', async () => {
  const response = await request(app)
    .get('/api/auth/me')
    .set('Authorization', 'Bearer invalid.token.value');

  assert.equal(response.status, 401);
});

test('GET /api/auth/me returns authenticated user', async (t) => {
  const email = `jwt-me-${Date.now()}@example.com`;

  const user = await userService.createUser({
    email,
    name: 'JWT Test User',
    passwordHash: 'test-hash'
  });

  t.after(async () => {
    await pool.query('DELETE FROM users WHERE id = $1', [user.id]);
  });

  const token = signToken(user);
  const response = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'success');
  assert.equal(response.body.data.user.id, user.id);
  assert.equal(response.body.data.user.password_hash, undefined);
});

test.after(async () => {
  await pool.end();
});
