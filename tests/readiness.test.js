const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/database/pool');

test('readiness endpoint confirms database connectivity', async () => {
  const response = await request(app).get('/api/ready');

  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'ready');
  assert.equal(response.body.database, 'connected');
});

test.after(async () => {
  await pool.end();
});
