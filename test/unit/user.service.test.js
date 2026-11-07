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

test('updateUser trims a valid name and sends only the name to the repository', async () => {
  const originalUpdateById = userRepository.updateById;
  let received;

  userRepository.updateById = async (id, data) => {
    received = { id, data };
    return { id, name: data.name };
  };

  try {
    const result = await userService.updateUser('user-123', {
      name: '  Updated User  '
    });

    assert.deepEqual(received, {
      id: 'user-123',
      data: { name: 'Updated User' }
    });
    assert.equal(result.name, 'Updated User');
  } finally {
    userRepository.updateById = originalUpdateById;
  }
});

test('updateUser rejects empty or whitespace-only names', async () => {
  for (const name of ['', '   ', '\t\n']) {
    await assert.rejects(
      userService.updateUser('user-123', { name }),
      { statusCode: 400 }
    );
  }
});

test('updateUser rejects non-string names', async () => {
  for (const name of [undefined, null, 123, {}, []]) {
    await assert.rejects(
      userService.updateUser('user-123', { name }),
      { statusCode: 400 }
    );
  }
});

test('updateUser rejects unsupported fields', async () => {
  await assert.rejects(
    userService.updateUser('user-123', {
      name: 'Updated User',
      email: 'other@example.com'
    }),
    { statusCode: 400 }
  );
});
