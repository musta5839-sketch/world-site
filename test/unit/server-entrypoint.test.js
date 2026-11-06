'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');

test('server entrypoint validates token configuration before starting the lifecycle', () => {
  const serverPath = require.resolve('../../src/server');
  const originalLoad = Module._load;
  const events = [];

  const fakeConfig = { port: 3000, environment: 'test' };
  const fakeApp = {};
  const fakePool = {};

  const stubs = {
    './config/config': fakeConfig,
    './utils/token': {
      validateTokenConfig() {
        events.push('validateTokenConfig');
      }
    },
    './app': fakeApp,
    './database/pool': fakePool,
    './server/lifecycle': {
      startServer(options) {
        events.push('startServer');
        assert.strictEqual(options.app, fakeApp);
        assert.strictEqual(options.config, fakeConfig);
        assert.strictEqual(options.pool, fakePool);
      }
    }
  };

  try {
    delete require.cache[serverPath];

    Module._load = function (request, parent, isMain) {
      if (
        parent &&
        parent.filename === serverPath &&
        Object.prototype.hasOwnProperty.call(stubs, request)
      ) {
        events.push(`load:${request}`);
        return stubs[request];
      }

      return originalLoad.call(this, request, parent, isMain);
    };

    require(serverPath);

    assert.deepStrictEqual(events, [
      'load:./config/config',
      'load:./utils/token',
      'validateTokenConfig',
      'load:./app',
      'load:./database/pool',
      'load:./server/lifecycle',
      'startServer'
    ]);
  } finally {
    Module._load = originalLoad;
    delete require.cache[serverPath];
  }
});
