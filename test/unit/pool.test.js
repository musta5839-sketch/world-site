const test = require('node:test');
const assert = require('node:assert/strict');

const poolModule = require('../../src/database/pool');
const createPool = poolModule.createPool;

class FakePool {
  constructor(options) {
    this.options = options;
    this.listeners = {};
  }

  on(event, callback) {
    this.listeners[event] = callback;
    return this;
  }
}

test('rejects missing database URL', () => {
  assert.throws(
    () => createPool(FakePool, {
      databaseUrl: '',
      environment: 'test'
    }),
    { message: 'DATABASE_URL is required' }
  );
});

test('creates pool with expected connection settings', () => {
  const pool = createPool(FakePool, {
    databaseUrl: 'postgresql://localhost/test',
    environment: 'test'
  });

  assert.equal(
    pool.options.connectionString,
    'postgresql://localhost/test'
  );
  assert.equal(pool.options.max, 10);
  assert.equal(pool.options.idleTimeoutMillis, 30000);
  assert.equal(pool.options.connectionTimeoutMillis, 5000);
  assert.equal(pool.options.ssl, false);
  assert.equal(typeof pool.listeners.error, 'function');
});

test('enables certificate verification in production', () => {
  const pool = createPool(FakePool, {
    databaseUrl: 'postgresql://localhost/production',
    environment: 'production'
  });

  assert.deepEqual(pool.options.ssl, {
    rejectUnauthorized: true
  });
});

test('keeps SSL disabled outside production', () => {
  for (const environment of ['development', 'test']) {
    const pool = createPool(FakePool, {
      databaseUrl: 'postgresql://localhost/test',
      environment
    });

    assert.equal(pool.options.ssl, false);
  }
});

test('logs unexpected pool errors', () => {
  const pool = createPool(FakePool, {
    databaseUrl: 'postgresql://localhost/test',
    environment: 'test'
  });

  const originalError = console.error;
  const calls = [];

  console.error = (...args) => calls.push(args);

  try {
    const error = new Error('connection lost');
    pool.listeners.error(error);

    assert.equal(calls.length, 1);
    assert.equal(
      calls[0][0],
      'Unexpected PostgreSQL pool error:'
    );
    assert.equal(calls[0][1], error);
  } finally {
    console.error = originalError;
  }
});
