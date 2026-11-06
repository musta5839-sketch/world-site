const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');
const { createRateLimiter } = require('../src/middleware/rate-limiters');

test('rate limiter uses the default limit of 100 when omitted', async () => {
  const app = express();

  app.use(createRateLimiter());

  app.get('/test', (req, res) => {
    res.sendStatus(200);
  });

  const response = await request(app).get('/test');

  assert.equal(response.status, 200);
  assert.match(response.headers.ratelimit || '', /100-in-15min/i);
});

test('rate limiter allows requests up to the configured limit', async () => {
  const app = express();

  app.use(createRateLimiter({
    windowMs: 60_000,
    limit: 2
  }));

  app.get('/test', (req, res) => {
    res.status(200).json({ success: true });
  });

  const first = await request(app).get('/test');
  const second = await request(app).get('/test');

  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
});

test('rate limiter returns 429 after the configured limit', async () => {
  const app = express();

  app.use(createRateLimiter({
    windowMs: 60_000,
    limit: 2
  }));

  app.get('/test', (req, res) => {
    res.status(200).json({ success: true });
  });

  await request(app).get('/test');
  await request(app).get('/test');

  const third = await request(app).get('/test');

  assert.equal(third.status, 429);
  assert.equal(third.body.success, false);
  assert.match(third.headers.ratelimit || '', /2-in-1min/i);
  assert.match(third.headers.ratelimit || '', /r=0/i);
  assert.equal(third.headers['x-ratelimit-limit'], undefined);
});

test('rate-limited requests do not execute the route handler', async () => {
  const app = express();
  let executions = 0;

  app.use(createRateLimiter({
    windowMs: 60_000,
    limit: 1
  }));

  app.get('/test', (req, res) => {
    executions += 1;
    res.sendStatus(200);
  });

  await request(app).get('/test');
  const blocked = await request(app).get('/test');

  assert.equal(blocked.status, 429);
  assert.equal(executions, 1);
});
