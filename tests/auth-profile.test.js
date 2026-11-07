const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { signToken } = require('../src/utils/token');
const userService = require('../src/services/user.service');
const pool = require('../src/database/pool');

test('PATCH /api/auth/me rejects missing token', async () => {
  const response = await request(app)
    .patch('/api/auth/me')
    .send({ name: 'Updated User' });

  assert.equal(response.status, 401);
});

test('PATCH /api/auth/me updates the authenticated user name', async (t) => {
  const user = await userService.createUser({
    email: `profile-${Date.now()}@example.com`,
    name: 'Original User',
    passwordHash: 'test-hash'
  });

  t.after(async () => {
    await pool.query('DELETE FROM users WHERE id = $1', [user.id]);
  });

  const token = signToken(user);
  const response = await request(app)
    .patch('/api/auth/me')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: '  Updated User  ' });

  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'success');
  assert.equal(response.body.data.user.id, user.id);
  assert.equal(response.body.data.user.name, 'Updated User');
  assert.equal(response.body.data.user.password_hash, undefined);

  const result = await pool.query(
    'SELECT name FROM users WHERE id = $1',
    [user.id]
  );

  assert.equal(result.rows[0].name, 'Updated User');
});

test('PATCH /api/auth/me rejects invalid names', async (t) => {
  const user = await userService.createUser({
    email: `profile-invalid-${Date.now()}@example.com`,
    name: 'Original User',
    passwordHash: 'test-hash'
  });

  t.after(async () => {
    await pool.query('DELETE FROM users WHERE id = $1', [user.id]);
  });

  const token = signToken(user);

  for (const name of ['', '   ', 123, null]) {
    const response = await request(app)
      .patch('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name });

    assert.equal(response.status, 400);
  }
});

test('PATCH /api/auth/me rejects unsupported fields', async (t) => {
  const user = await userService.createUser({
    email: `profile-fields-${Date.now()}@example.com`,
    name: 'Original User',
    passwordHash: 'test-hash'
  });

  t.after(async () => {
    await pool.query('DELETE FROM users WHERE id = $1', [user.id]);
  });

  const token = signToken(user);
  const response = await request(app)
    .patch('/api/auth/me')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Updated User', isActive: false });

  assert.equal(response.status, 400);
});
