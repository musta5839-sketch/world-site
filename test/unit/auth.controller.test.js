const test = require('node:test');
const assert = require('node:assert/strict');

const authService = require('../../src/services/auth.service');
const authController = require('../../src/controllers/auth.controller');

test('login uses the default JWT expiry when JWT_EXPIRES_IN is unset', async () => {
  const originalExpiry = process.env.JWT_EXPIRES_IN;
  const originalLogin = authService.login;

  const user = {
    id: 'controller-test-user',
    email: 'controller-test@example.com',
    name: 'Controller Test'
  };

  let statusCode;
  let responseBody;
  let nextError;

  const req = {
    body: {
      email: user.email,
      password: 'TestPassword123!'
    }
  };

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    }
  };

  try {
    delete process.env.JWT_EXPIRES_IN;

    authService.login = async () => user;

    await authController.login(req, res, (error) => {
      nextError = error;
    });

    assert.equal(nextError, undefined);
    assert.equal(statusCode, 200);
    assert.equal(responseBody.status, 'success');
    assert.equal(responseBody.data.user, user);
    assert.equal(responseBody.data.tokenType, 'Bearer');
    assert.equal(responseBody.data.expiresIn, '15m');
    assert.equal(typeof responseBody.data.token, 'string');
    assert.ok(responseBody.data.token.length > 0);
  } finally {
    authService.login = originalLogin;

    if (originalExpiry === undefined) {
      delete process.env.JWT_EXPIRES_IN;
    } else {
      process.env.JWT_EXPIRES_IN = originalExpiry;
    }
  }
});
