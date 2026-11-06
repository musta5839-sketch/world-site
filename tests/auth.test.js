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

test('registration rejects missing required fields', async () => {
  const response = await request(app)
    .post('/api/auth/register')
    .send({});

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
  assert.equal(
    response.body.error,
    'Email, password and name are required'
  );
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

test('login rejects inactive users with correct credentials', async () => {
  await pool.query(
    'UPDATE users SET is_active = FALSE WHERE id = $1',
    [userId]
  );

  try {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email, password });

    assert.equal(response.status, 401);
    assert.equal(response.body.data?.token, undefined);
  } finally {
    await pool.query(
      'UPDATE users SET is_active = TRUE WHERE id = $1',
      [userId]
    );
  }
});

test.after(async () => {
  if (userId) {
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
  }

  await pool.end();
});
