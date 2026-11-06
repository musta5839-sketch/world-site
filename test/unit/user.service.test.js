const test = require('node:test');
const assert = require('node:assert/strict');

const userRepository = require('../../src/repositories/user.repository');
const userService = require('../../src/services/user.service');

test('createUser rethrows unexpected repository errors unchanged', async () => {
  const originalCreate = userRepository.create;
  const expectedError = Object.assign(
    new Error('Database unavailable'),
    { code: 'DB_ERROR' }
  );

  userRepository.create = async () => {
    throw expectedError;
  };

  try {
    await assert.rejects(
      userService.createUser({
        email: 'test@example.com',
        passwordHash: 'test-hash',
        name: 'Test User'
      }),
      error => {
        assert.strictEqual(error, expectedError);
        assert.equal(error.code, 'DB_ERROR');
        assert.equal(error.statusCode, undefined);
        return true;
      }
    );
  } finally {
    userRepository.create = originalCreate;
  }
});

test('getUserByEmail returns null without querying the repository for falsy email', async () => {
  const originalFindByEmail = userRepository.findByEmail;
  let calls = 0;

  userRepository.findByEmail = async () => {
    calls += 1;
    return null;
  };

  try {
    for (const email of [undefined, null, '']) {
      assert.strictEqual(await userService.getUserByEmail(email), null);
    }

    assert.equal(calls, 0);
  } finally {
    userRepository.findByEmail = originalFindByEmail;
  }
});
