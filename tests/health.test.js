const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const app = require('../src/app');

test('1. Health endpoint returns 200', async () => {
  const response = await request(app)
    .get('/api/health')
    .expect(200);

  assert.equal(response.body.success, true);
  assert.equal(response.body.application, 'WORLD');
  assert.equal(response.body.status, 'online');
  assert.equal(response.body.version, '1.0.0');
  assert.ok(Date.parse(response.body.timestamp));
});

test('2. Homepage returns 200', async () => {
  const response = await request(app)
    .get('/')
    .expect(200);

  assert.match(response.text, /WORLD/);
});

test('3. CSS returns 200', async () => {
  await request(app)
    .get('/css/style.css')
    .expect(200);
});

test('4. JavaScript returns 200', async () => {
  await request(app)
    .get('/js/app.js')
    .expect(200);
});

test('5. Unknown route returns 404', async () => {
  const response = await request(app)
    .get('/api/unknown')
    .expect(404);

  assert.equal(response.body.success, false);
  assert.equal(response.body.error, 'ROUTE_NOT_FOUND');
});

test('6. Security headers are enabled', async () => {
  const response = await request(app)
    .get('/api/health')
    .expect(200);

  assert.equal(
    response.headers['x-content-type-options'],
    'nosniff'
  );

  assert.equal(
    response.headers['x-powered-by'],
    undefined
  );
});

test('7. Invalid JSON returns 400', async () => {
  await request(app)
    .post('/api/health')
    .set('Content-Type', 'application/json')
    .send('{"invalid":')
    .expect(400);
});

test('8. Oversized JSON returns 413', async () => {
  const payload = JSON.stringify({
    data: 'x'.repeat(1024 * 1024 + 100)
  });

  await request(app)
    .post('/api/health')
    .set('Content-Type', 'application/json')
    .send(payload)
    .expect(413);
});
