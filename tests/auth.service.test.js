const test = require('node:test');
const assert = require('node:assert/strict');
const authService = require('../src/services/auth.service');

test('login rejects missing required credentials', async () => {
  await assert.rejects(
    authService.login({}),
    (error) => {
      assert.equal(error.statusCode, 400);
      assert.equal(error.message, 'Email and password are required');
      return true;
    }
  );
});
