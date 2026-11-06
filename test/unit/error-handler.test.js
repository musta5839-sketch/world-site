const test = require('node:test');
const assert = require('node:assert/strict');

const errorHandler = require('../../src/middleware/error-handler');

function invoke(error, environment = 'test') {
  const previousEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = environment;

  const response = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };

  const originalError = console.error;
  console.error = () => {};

  try {
    errorHandler(error, {}, response, () => {});
  } finally {
    console.error = originalError;

    if (previousEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousEnv;
    }
  }

  return response;
}

test('uses statusCode when valid', () => {
  const response = invoke({ statusCode: 422, message: 'Invalid input' });
  assert.equal(response.statusCode, 422);
  assert.equal(response.body.error, 'Invalid input');
});

test('uses status when statusCode is absent', () => {
  const response = invoke({ status: 404, message: 'Not found' });
  assert.equal(response.statusCode, 404);
});

test('falls back to 500 for invalid status', () => {
  for (const status of [200, 399, 600, 1.5, 'invalid']) {
    const response = invoke({ status, message: 'Failure' });
    assert.equal(response.statusCode, 500);
  }
});

test('uses generic message for production server errors', () => {
  const response = invoke(
    { statusCode: 500, message: 'Database credentials leaked' },
    'production'
  );

  assert.equal(response.statusCode, 500);
  assert.equal(response.body.error, 'INTERNAL_SERVER_ERROR');
});

test('preserves production client error messages', () => {
  const response = invoke(
    { statusCode: 400, message: 'Invalid request' },
    'production'
  );

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error, 'Invalid request');
});

test('uses fallback message when error message is absent', () => {
  const response = invoke({});
  assert.equal(response.body.error, 'Internal Server Error');
});
