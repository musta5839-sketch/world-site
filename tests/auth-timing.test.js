const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/database/pool');
const authService = require('../src/services/auth.service');

test('login returns the same status for unknown email and wrong password', async () => {
  const email = `timing-${Date.now()}@example.com`;

  const user = await authService.register({
    email,
    name: 'Timing Test',
    password: 'CorrectPassword123'
  });

  const unknown = await request(app)
    .post('/api/auth/login')
    .send({
      email: `missing-${email}`,
      password: 'WrongPassword123'
    });

  const wrong = await request(app)
    .post('/api/auth/login')
    .send({
      email,
      password: 'WrongPassword123'
    });

  assert.equal(unknown.status, 401);
  assert.equal(wrong.status, 401);

  await pool.query('DELETE FROM users WHERE email = $1', [email]);
});

test.after(async () => {
  await pool.end();
});
