const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');
const {
  createRateLimiter
} = require('../src/middleware/rate-limiters');

test('auth routes use their own limiter without consuming the API quota', async () => {
  const app = express();

  const apiLimiter = createRateLimiter({
    limit: 1,
    skip: (req) =>
      req.path === '/auth' ||
      req.path.startsWith('/auth/')
  });

  const authLimiter = createRateLimiter({
    limit: 2
  });

  app.use('/api', apiLimiter);

  const authRouter = express.Router();
  authRouter.use(authLimiter);
  authRouter.post('/login', (req, res) => {
    res.sendStatus(200);
  });

  app.use('/api/auth', authRouter);

  app.get('/api/health', (req, res) => {
    res.sendStatus(200);
  });

  assert.equal((await request(app).post('/api/auth/login')).status, 200);
  assert.equal((await request(app).post('/api/auth/login')).status, 200);
  assert.equal((await request(app).post('/api/auth/login')).status, 429);

  assert.equal((await request(app).get('/api/health')).status, 200);
  assert.equal((await request(app).get('/api/health')).status, 429);
});

test('auth limiter blocks requests before executing auth handlers', async () => {
  const app = express();
  let executions = 0;

  const authRouter = express.Router();

  authRouter.use(createRateLimiter({
    limit: 1
  }));

  authRouter.post('/login', (req, res) => {
    executions += 1;
    res.sendStatus(200);
  });

  app.use('/api/auth', authRouter);

  assert.equal((await request(app).post('/api/auth/login')).status, 200);
  assert.equal((await request(app).post('/api/auth/login')).status, 429);
  assert.equal(executions, 1);
});

test('API limiter does not skip paths that only share the auth prefix', async () => {
  const app = express();

  app.use('/api', createRateLimiter({
    limit: 1,
    skip: (req) =>
      req.path === '/auth' ||
      req.path.startsWith('/auth/')
  }));

  app.get('/api/authentication', (req, res) => {
    res.sendStatus(200);
  });

  assert.equal((await request(app).get('/api/authentication')).status, 200);
  assert.equal((await request(app).get('/api/authentication')).status, 429);
});
