const test = require('node:test');
const assert = require('node:assert/strict');

const { startServer } = require('../../src/server/lifecycle');
const {
  isShuttingDown,
  setShuttingDown
} = require('../../src/runtime/shutdown-state');

function createHarness(options = {}) {
  const events = [];
  const listeners = {};
  const timer = {
    unrefCalled: false,
    unref() {
      this.unrefCalled = true;
    }
  };

  let closeCallback;
  let timerCallback;
  let exitCode;

  const server = {
    close(callback) {
      events.push('server.close');
      closeCallback = callback;
    }
  };

  const app = {
    listen(port, host, callback) {
      events.push(`listen:${port}:${host}`);
      if (callback) callback();
      return server;
    }
  };

  const pool = {
    async end() {
      events.push('pool.end');
      if (options.poolError) throw options.poolError;
    }
  };

  const processRef = {
    on(signal, callback) {
      listeners[signal] = callback;
    }
  };

  const logger = {
    log() {
      events.push('log');
    },
    error() {
      events.push('error');
    }
  };

  const lifecycle = startServer({
    app,
    config: { port: 3000 },
    pool,
    processRef,
    logger,
    setTimer(callback, delay) {
      events.push(`timer:${delay}`);
      timerCallback = callback;
      return timer;
    },
    clearTimer(value) {
      assert.equal(value, timer);
      events.push('clearTimer');
    },
    exit(code) {
      exitCode = code;
      events.push(`exit:${code}`);
    }
  });

  return {
    events,
    listeners,
    lifecycle,
    timer,
    get closeCallback() {
      return closeCallback;
    },
    get timerCallback() {
      return timerCallback;
    },
    get exitCode() {
      return exitCode;
    }
  };
}

test('starts HTTP server and registers shutdown signals', () => {
  setShuttingDown(false);
  const harness = createHarness();

  assert.ok(harness.lifecycle.server);
  assert.equal(typeof harness.listeners.SIGINT, 'function');
  assert.equal(typeof harness.listeners.SIGTERM, 'function');
  assert.ok(harness.events.includes('listen:3000:0.0.0.0'));
});

test('graceful shutdown closes HTTP before database and exits successfully', async () => {
  setShuttingDown(false);
  const harness = createHarness();

  harness.listeners.SIGTERM();

  assert.equal(harness.lifecycle.isShuttingDown(), true);
  assert.equal(isShuttingDown(), true);
  assert.equal(harness.timer.unrefCalled, true);

  await harness.closeCallback();

  assert.ok(
    harness.events.indexOf('server.close') <
    harness.events.indexOf('pool.end')
  );
  assert.ok(
    harness.events.indexOf('pool.end') <
    harness.events.indexOf('exit:0')
  );
  assert.equal(harness.exitCode, 0);
  assert.ok(harness.events.includes('clearTimer'));
});

test('repeated shutdown signals execute cleanup only once', () => {
  setShuttingDown(false);
  const harness = createHarness();

  harness.listeners.SIGTERM();
  harness.listeners.SIGINT();
  harness.lifecycle.shutdown();

  assert.equal(
    harness.events.filter((event) => event === 'server.close').length,
    1
  );
  assert.equal(
    harness.events.filter((event) => event === 'timer:10000').length,
    1
  );
});

test('database shutdown failure exits with code 1', async () => {
  setShuttingDown(false);
  const harness = createHarness({
    poolError: new Error('database shutdown failed')
  });

  harness.listeners.SIGINT();
  await harness.closeCallback();

  assert.equal(harness.exitCode, 1);
  assert.ok(harness.events.includes('error'));
  assert.ok(harness.events.includes('clearTimer'));
});

test('forced shutdown timer exits with code 1', () => {
  setShuttingDown(false);
  const harness = createHarness();

  harness.listeners.SIGTERM();
  harness.timerCallback();

  assert.equal(harness.exitCode, 1);
});

test('HTTP close failure exits with code 1', () => {
  setShuttingDown(false);
  const harness = createHarness();

  harness.listeners.SIGTERM();
  harness.closeCallback(new Error('HTTP close failed'));

  assert.equal(harness.exitCode, 1);
  assert.ok(harness.events.includes('error'));
});

test('rejects invalid server dependencies', () => {
  assert.throws(
    () => startServer({
      app: {},
      config: { port: 3000 },
      pool: { end: async () => {} }
    }),
    /app\.listen is required/
  );

  assert.throws(
    () => startServer({
      app: { listen() {} },
      config: { port: 0 },
      pool: { end: async () => {} }
    }),
    /valid server port/
  );

  assert.throws(
    () => startServer({
      app: { listen() {} },
      config: { port: 3000 },
      pool: {}
    }),
    /pool\.end is required/
  );
});
