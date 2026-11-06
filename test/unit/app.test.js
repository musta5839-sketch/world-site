const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');

const appPath = require.resolve('../../src/app');

test('mounts Morgan logging outside the test environment', () => {
  const originalLoad = Module._load;
  const originalEnv = { ...process.env };
  const mounted = [];
  const calls = [];
  const loggerMiddleware = (req, res, next) => next();

  const app = {
    disable() {},
    use(...args) {
      mounted.push(args);
    }
  };

  function express() {
    return app;
  }

  express.json = () => function jsonMiddleware() {};
  express.urlencoded = () => function urlencodedMiddleware() {};
  express.static = () => function staticMiddleware() {};

  const stubs = {
    './config/config': { environment: 'development' },
    express,
    helmet: () => function helmetMiddleware() {},
    cors: () => function corsMiddleware() {},
    morgan: (format) => {
      calls.push(format);
      return loggerMiddleware;
    },
    './middleware/rate-limiters': {
      apiLimiter: function apiLimiter() {}
    },
    './routes/auth.routes': function authRoutes() {},
    './routes/health.routes': function healthRoutes() {},
    './routes/readiness.routes': function readinessRoutes() {},
    './middleware/not-found': function notFound() {},
    './middleware/error-handler': function errorHandler() {}
  };

  try {
    process.env.NODE_ENV = 'development';

    Module._load = function (request, parent, isMain) {
      if (parent?.filename === appPath &&
          Object.prototype.hasOwnProperty.call(stubs, request)) {
        return stubs[request];
      }

      return originalLoad.call(this, request, parent, isMain);
    };

    delete require.cache[appPath];
    require(appPath);

    assert.deepEqual(calls, ['dev']);
    assert.ok(
      mounted.some((args) => args.includes(loggerMiddleware)),
      'Morgan middleware must be mounted on the Express app'
    );
  } finally {
    Module._load = originalLoad;
    process.env = originalEnv;
    delete require.cache[appPath];
  }
});
