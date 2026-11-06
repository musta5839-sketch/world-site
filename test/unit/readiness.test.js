const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const queryPath = require.resolve('../../src/database/query');
const statePath = require.resolve('../../src/runtime/shutdown-state');
const readinessPath = require.resolve('../../src/routes/readiness.routes');

function loadRouter(queryImplementation) {
  require.cache[queryPath] = {
    id: queryPath,
    filename: queryPath,
    loaded: true,
    exports: { query: queryImplementation }
  };

  delete require.cache[readinessPath];
  return require(readinessPath);
}

function createResponse() {
  return {
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
}

test('readiness returns 200 when database responds', async () => {
  const state = require(statePath);
  state.setShuttingDown(false);

  let sql;
  const router = loadRouter(async (text) => {
    sql = text;
    return { rows: [{ '?column?': 1 }] };
  });

  const handler = router.stack.find((layer) => layer.route).route.stack[0].handle;
  const response = createResponse();
  let forwardedError;

  await handler({}, response, (error) => {
    forwardedError = error;
  });

  assert.equal(sql, 'SELECT 1');
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'ready');
  assert.equal(forwardedError, undefined);
});

test('readiness forwards database errors to error middleware', async () => {
  const state = require(statePath);
  state.setShuttingDown(false);

  const databaseError = new Error('database unavailable');
  const router = loadRouter(async () => {
    throw databaseError;
  });

  const handler = router.stack.find((layer) => layer.route).route.stack[0].handle;
  const response = createResponse();
  let forwardedError;

  await handler({}, response, (error) => {
    forwardedError = error;
  });

  assert.equal(forwardedError, databaseError);
});

test('readiness returns 503 without querying during shutdown', async () => {
  const state = require(statePath);
  state.setShuttingDown(true);

  let queryCalled = false;
  const router = loadRouter(async () => {
    queryCalled = true;
  });

  const handler = router.stack.find((layer) => layer.route).route.stack[0].handle;
  const response = createResponse();

  await handler({}, response, () => {
    assert.fail('error middleware should not be called');
  });

  assert.equal(queryCalled, false);
  assert.equal(response.statusCode, 503);
  assert.equal(response.body.status, 'shutting_down');

  state.setShuttingDown(false);
});

test('readiness returns 503 if shutdown begins during database check', async () => {
  const state = require(statePath);
  state.setShuttingDown(false);

  const router = loadRouter(async () => {
    state.setShuttingDown(true);
    return { rows: [{ '?column?': 1 }] };
  });

  const handler = router.stack.find((layer) => layer.route).route.stack[0].handle;
  const response = createResponse();

  await handler({}, response, () => {
    assert.fail('error middleware should not be called');
  });

  assert.equal(response.statusCode, 503);
  assert.equal(response.body.status, 'shutting_down');

  state.setShuttingDown(false);
});
