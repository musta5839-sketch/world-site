const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { signToken, verifyToken } = require('../src/utils/token');

process.env.JWT_SECRET ||= 'test-secret-with-at-least-32-characters-long';
process.env.JWT_EXPIRES_IN = '15m';

test('signToken creates a verifiable JWT', () => {
  const token = signToken({ id: 'test-user-id' });

  assert.equal(typeof token, 'string');

  const payload = verifyToken(token);

  assert.equal(payload.sub, 'test-user-id');
  assert.equal(payload.iss, 'world-site');
  assert.equal(payload.aud, 'world-site-client');
  assert.ok(payload.exp > payload.iat);
});

test('verifyToken rejects malformed tokens', () => {
  assert.throws(() => verifyToken('invalid.token.value'));
});

test('verifyToken rejects tokens signed with another secret', () => {
  const token = jwt.sign(
    { sub: 'test-user-id' },
    'another-secret-with-at-least-32-characters',
    {
      algorithm: 'HS256',
      issuer: 'world-site',
      audience: 'world-site-client'
    }
  );

  assert.throws(() => verifyToken(token));
});

test('verifyToken rejects a wrong issuer', () => {
  const token = jwt.sign(
    { sub: 'test-user-id' },
    process.env.JWT_SECRET,
    {
      algorithm: 'HS256',
      issuer: 'wrong-issuer',
      audience: 'world-site-client'
    }
  );

  assert.throws(() => verifyToken(token));
});

test('verifyToken rejects a wrong audience', () => {
  const token = jwt.sign(
    { sub: 'test-user-id' },
    process.env.JWT_SECRET,
    {
      algorithm: 'HS256',
      issuer: 'world-site',
      audience: 'wrong-audience'
    }
  );

  assert.throws(() => verifyToken(token));
});

test('verifyToken rejects expired tokens', () => {
  const token = jwt.sign(
    { sub: 'test-user-id' },
    process.env.JWT_SECRET,
    {
      algorithm: 'HS256',
      issuer: 'world-site',
      audience: 'world-site-client',
      expiresIn: -1
    }
  );

  assert.throws(() => verifyToken(token));
});
