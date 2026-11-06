const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/database/pool');

const email = `auth_${Date.now()}@example.com`;
const password = 'StrongPassword123!';
let userId;

test('registration creates a user without exposing password hash', async () => {
  const response = await request(app)
    .post('/api/auth/register')
    .send({ email, password, name: 'Auth Test' });

  assert.equal(response.status, 201);
  assert.equal(response.body.status, 'success');
  assert.equal(response.body.data.user.email, email);
  assert.equal(response.body.data.user.password_hash, undefined);

  userId = response.body.data.user.id;

  const result = await pool.query(
    'SELECT password_hash FROM users WHERE id = $1',
    [userId]
  );

  assert.ok(result.rows[0].password_hash);
  assert.notEqual(result.rows[0].password_hash, password);
});

test('registration rejects duplicate email', async () => {
  const response = await request(app)
    .post('/api/auth/register')
    .send({ email, password, name: 'Duplicate' });

  assert.equal(response.status, 409);
});

test('registration rejects invalid email', async () => {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'invalid-email',
      password,
      name: 'Invalid'
    });

  assert.equal(response.status, 400);
});

test('registration rejects short password', async () => {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      email: `short_${Date.now()}@example.com`,
      password: '123',
      name: 'Short Password'
    });

  assert.equal(response.status, 400);
});

test('registration rejects password longer than 72 characters', async () => {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      email: `long_${Date.now()}@example.com`,
      password: 'a'.repeat(73),
      name: 'Long Password'
    });

  assert.equal(response.status, 400);
});

test('login accepts correct credentials', async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'success');
  assert.equal(response.body.data.user.email, email);
  assert.equal(response.body.data.user.password_hash, undefined);
});

test('login rejects incorrect password', async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({
      email,
      password: 'WrongPassword123!'
    });

  assert.equal(response.status, 401);
});

test('login rejects unknown email', async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({
      email: `missing_${Date.now()}@example.com`,
      password
    });

  assert.equal(response.status, 401);
});

test.after(async () => {
  if (userId) {
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
  }

  await pool.end();
});
