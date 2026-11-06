const test = require('node:test');
const assert = require('node:assert/strict');

const { signToken, verifyToken } = require('../../src/utils/token');

function withSecret(secret, callback) {
  const previousSecret = process.env.JWT_SECRET;

  if (secret === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = secret;
  }

  try {
    return callback();
  } finally {
    if (previousSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = previousSecret;
    }
  }
}

test('rejects missing JWT secret when signing', () => {
  assert.throws(
    () => withSecret(undefined, () => signToken({ id: 'user-1' })),
    /JWT_SECRET must be at least 32 characters/
  );
});

test('rejects missing JWT secret when verifying', () => {
  assert.throws(
    () => withSecret(undefined, () => verifyToken('invalid-token')),
    /JWT_SECRET must be at least 32 characters/
  );
});

test('rejects JWT secret shorter than 32 characters', () => {
  assert.throws(
    () => withSecret('a'.repeat(31), () => signToken({ id: 'user-1' })),
    /JWT_SECRET must be at least 32 characters/
  );
});

test('accepts JWT secret with exactly 32 characters', () => {
  const token = withSecret('a'.repeat(32), () =>
    signToken({ id: 'user-1' })
  );

  const payload = withSecret('a'.repeat(32), () =>
    verifyToken(token)
  );

  assert.equal(payload.sub, 'user-1');
});

test('accepts JWT secret longer than 32 characters', () => {
  const secret = 'a'.repeat(33);

  const token = withSecret(secret, () =>
    signToken({ id: 'user-2' })
  );

  const payload = withSecret(secret, () =>
    verifyToken(token)
  );

  assert.equal(payload.sub, 'user-2');
});
