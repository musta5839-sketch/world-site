const test = require('node:test');
const assert = require('node:assert/strict');
const {
  hashPassword,
  verifyPassword
} = require('../src/utils/password');

test('password hashing produces a hash different from plaintext', async () => {
  const password = 'StrongPassword123!';
  const hash = await hashPassword(password);

  assert.notEqual(hash, password);
  assert.ok(hash.startsWith('$2'));
});

test('correct password verification succeeds', async () => {
  const password = 'StrongPassword123!';
  const hash = await hashPassword(password);

  assert.equal(await verifyPassword(password, hash), true);
});

test('incorrect password verification fails', async () => {
  const hash = await hashPassword('StrongPassword123!');

  assert.equal(
    await verifyPassword('WrongPassword123!', hash),
    false
  );
});

test('password shorter than 8 characters is rejected', async () => {
  await assert.rejects(
    hashPassword('1234567'),
    { statusCode: 400 }
  );
});

test('password longer than 72 characters is rejected', async () => {
  await assert.rejects(
    hashPassword('a'.repeat(73)),
    { statusCode: 400 }
  );
});

test('invalid verification inputs return false', async () => {
  assert.equal(await verifyPassword(null, 'hash'), false);
  assert.equal(await verifyPassword('password', null), false);
});
