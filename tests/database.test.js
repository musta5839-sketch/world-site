const test = require('node:test');
const assert = require('node:assert/strict');
const pool = require('../src/database/pool');
const { query, transaction } = require('../src/database/query');

test('database connection executes SELECT 1', async () => {
  const result = await query('SELECT 1 AS value');
  assert.equal(result.rows[0].value, 1);
});

test('users table exists in test database', async () => {
  const result = await query(`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'users'
    ) AS exists
  `);

  assert.equal(result.rows[0].exists, true);
});

test('transaction rolls back failed operations', async () => {
  const tableName = `rollback_test_${Date.now()}`;

  await assert.rejects(
    transaction(async (client) => {
      await client.query(`CREATE TEMP TABLE ${tableName} (id integer)`);
      await client.query(`INSERT INTO ${tableName} (id) VALUES (1)`);
      throw new Error('rollback test');
    }),
    /rollback test/
  );

  const result = await query(`
    SELECT to_regclass('pg_temp.${tableName}') AS table_name
  `);

  assert.equal(result.rows[0].table_name, null);
});

test.after(async () => {
  await pool.end();
});
