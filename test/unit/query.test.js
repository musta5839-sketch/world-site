const test = require('node:test');
const assert = require('node:assert/strict');

const poolPath = require.resolve('../../src/database/pool');
const queryPath = require.resolve('../../src/database/query');

function loadQueryModule() {
  const originalPool = require.cache[poolPath];
  const originalQuery = require.cache[queryPath];

  const calls = [];
  const client = {
    async query(text, params) {
      calls.push({ target: 'client', text, params });

      if (text === 'FAIL') {
        throw new Error('query failed');
      }

      return { rows: [{ result: 1 }] };
    },
    release() {
      calls.push({ target: 'release' });
    }
  };

  const fakePool = {
    async query(text, params) {
      calls.push({ target: 'pool', text, params });
      return { rows: [{ result: 1 }] };
    },
    async connect() {
      calls.push({ target: 'connect' });
      return client;
    }
  };

  require.cache[poolPath] = {
    id: poolPath,
    filename: poolPath,
    loaded: true,
    exports: fakePool
  };

  delete require.cache[queryPath];

  try {
    return {
      module: require(queryPath),
      calls
    };
  } finally {
    delete require.cache[queryPath];

    if (originalQuery) {
      require.cache[queryPath] = originalQuery;
    }

    if (originalPool) {
      require.cache[poolPath] = originalPool;
    } else {
      delete require.cache[poolPath];
    }
  }
}

test('query forwards SQL and parameters to pool', async () => {
  const { module, calls } = loadQueryModule();

  const result = await module.query('SELECT $1', [1]);

  assert.deepEqual(result.rows, [{ result: 1 }]);
  assert.deepEqual(calls, [
    {
      target: 'pool',
      text: 'SELECT $1',
      params: [1]
    }
  ]);
});

test('transaction commits successful operations', async () => {
  const { module, calls } = loadQueryModule();

  const result = await module.transaction(async (client) => {
    return client.query('SELECT 1');
  });

  assert.deepEqual(result.rows, [{ result: 1 }]);
  assert.deepEqual(
    calls.map((call) => call.text || call.target),
    ['connect', 'BEGIN', 'SELECT 1', 'COMMIT', 'release']
  );
});

test('transaction rolls back failed operations', async () => {
  const { module, calls } = loadQueryModule();

  await assert.rejects(
    module.transaction(async (client) => {
      await client.query('FAIL');
    }),
    { message: 'query failed' }
  );

  assert.deepEqual(
    calls.map((call) => call.text || call.target),
    ['connect', 'BEGIN', 'FAIL', 'ROLLBACK', 'release']
  );
});

test('transaction releases client when callback throws', async () => {
  const { module, calls } = loadQueryModule();

  await assert.rejects(
    module.transaction(async () => {
      throw new Error('callback failed');
    }),
    { message: 'callback failed' }
  );

  assert.deepEqual(
    calls.map((call) => call.text || call.target),
    ['connect', 'BEGIN', 'ROLLBACK', 'release']
  );
});
