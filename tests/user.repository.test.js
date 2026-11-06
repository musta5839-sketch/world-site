const test = require('node:test');
const assert = require('node:assert/strict');
const pool = require('../src/database/pool');
const userService = require('../src/services/user.service');

const createdUsers = [];

test('user CRUD operations', async () => {
  const email = `test-${Date.now()}@example.com`;

  const user = await userService.createUser({
    email,
    passwordHash: 'test-hash',
    name: 'Test User'
  });

  createdUsers.push(user.id);

  assert.equal(user.email, email.toLowerCase());
  assert.equal(user.name, 'Test User');

  const byId = await userService.getUserById(user.id);
  assert.equal(byId.id, user.id);

  const byEmail = await userService.getUserByEmail(email);
  assert.equal(byEmail.id, user.id);

  const updated = await userService.updateUser(user.id, {
    name: 'Updated User'
  });

  assert.equal(updated.name, 'Updated User');

  const deleted = await userService.deleteUser(user.id);
  assert.equal(deleted, true);

  const missing = await userService.getUserById(user.id);
  assert.equal(missing, null);

  const missingUpdate = await userService.updateUser(user.id, {
    name: 'Should Not Exist'
  });
  assert.equal(missingUpdate, null);

  const deletedAgain = await userService.deleteUser(user.id);
  assert.equal(deletedAgain, false);
});

test('duplicate email returns conflict', async () => {
  const email = `duplicate-${Date.now()}@example.com`;

  const user = await userService.createUser({
    email,
    passwordHash: 'test-hash',
    name: 'First User'
  });

  createdUsers.push(user.id);

  await assert.rejects(
    userService.createUser({
      email,
      passwordHash: 'test-hash',
      name: 'Second User'
    }),
    (error) => error.statusCode === 409
  );
});

test('invalid user data returns 400', async () => {
  await assert.rejects(
    userService.createUser({
      email: '',
      passwordHash: '',
      name: ''
    }),
    (error) => error.statusCode === 400
  );
});

test.after(async () => {
  if (createdUsers.length) {
    await pool.query(
      'DELETE FROM users WHERE id = ANY($1::uuid[])',
      [createdUsers]
    );
  }

  await pool.end();
});
