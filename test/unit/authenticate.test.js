const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET ||= 'test-secret-with-at-least-32-characters-long';

const authenticate = require('../../src/middleware/authenticate');

function createRequest(token) {
  return {
    headers: {
      authorization: `Bearer ${token}`
    }
  };
}

function createToken(options = {}) {
  return jwt.sign(
    { sub: 'test-user-id' },
    process.env.JWT_SECRET,
    {
      algorithm: 'HS256',
      issuer: 'world-site',
      audience: 'world-site-client',
      ...options
    }
  );
}

async function runMiddleware(token) {
  const req = createRequest(token);
  let nextError;

  await authenticate(req, {}, error => {
    nextError = error;
  });

  return nextError;
}

test('authenticate rejects whitespace-only Bearer credentials', async () => {
  const error = await runMiddleware('   ');

  assert.equal(error.name, 'Error');
  assert.equal(error.statusCode, 401);
  assert.equal(error.message, 'Authentication required');
});

test('authenticate normalizes NotBeforeError to 401', async () => {
  const token = createToken({
    notBefore: '10m'
  });

  const error = await runMiddleware(token);

  assert.equal(error.name, 'NotBeforeError');
  assert.equal(error.statusCode, 401);
  assert.equal(error.message, 'Invalid or expired token');
});

test('authenticate normalizes TokenExpiredError to 401', async () => {
  const token = createToken({
    expiresIn: -1
  });

  const error = await runMiddleware(token);

  assert.equal(error.name, 'TokenExpiredError');
  assert.equal(error.statusCode, 401);
  assert.equal(error.message, 'Invalid or expired token');
});

test('authenticate normalizes JsonWebTokenError to 401', async () => {
  const error = await runMiddleware('invalid.token.value');

  assert.equal(error.name, 'JsonWebTokenError');
  assert.equal(error.statusCode, 401);
  assert.equal(error.message, 'Invalid or expired token');
});

test('authenticate passes non-JWT errors to next unchanged', async () => {
  const userService = require('../../src/services/user.service');
  const originalGetUserById = userService.getUserById;
  const expectedError = Object.assign(new Error('Database unavailable'), {
    code: 'DB_ERROR'
  });

  userService.getUserById = async () => {
    throw expectedError;
  };

  try {
    const token = createToken();
    const error = await runMiddleware(token);

    assert.strictEqual(error, expectedError);
    assert.equal(error.name, 'Error');
    assert.equal(error.message, 'Database unavailable');
    assert.equal(error.code, 'DB_ERROR');
    assert.equal(error.statusCode, undefined);
  } finally {
    userService.getUserById = originalGetUserById;
  }
});
