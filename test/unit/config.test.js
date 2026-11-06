const test = require('node:test');
const assert = require('node:assert/strict');

const configPath = require.resolve('../../src/config/config');

function loadConfig(env = {}) {
  const previousEnv = { ...process.env };

  try {
    for (const key of [
      'PORT',
      'NODE_ENV',
      'DATABASE_URL',
      'TEST_DATABASE_URL'
    ]) {
      delete process.env[key];
    }

    Object.assign(process.env, env);
    delete require.cache[configPath];

    return require(configPath);
  } finally {
    process.env = previousEnv;
    delete require.cache[configPath];
  }
}

test('uses default port and development environment', () => {
  const config = loadConfig({
    DATABASE_URL: 'postgresql://localhost/main'
  });

  assert.equal(config.port, 3000);
  assert.equal(config.environment, 'development');
  assert.equal(
    config.databaseUrl,
    'postgresql://localhost/main'
  );
});

test('accepts minimum valid port', () => {
  assert.equal(
    loadConfig({ PORT: '1' }).port,
    1
  );
});

test('accepts maximum valid port', () => {
  assert.equal(
    loadConfig({ PORT: '65535' }).port,
    65535
  );
});

test('rejects invalid ports', () => {
  for (const port of ['0', '-1', '65536', '3.14', 'abc']) {
    assert.throws(
      () => loadConfig({ PORT: port }),
      { message: 'Invalid PORT configuration' }
    );
  }
});

test('accepts development environment', () => {
  assert.equal(
    loadConfig({ NODE_ENV: 'development' }).environment,
    'development'
  );
});

test('accepts production environment', () => {
  assert.equal(
    loadConfig({ NODE_ENV: 'production' }).environment,
    'production'
  );
});

test('accepts test environment and selects test database', () => {
  const config = loadConfig({
    NODE_ENV: 'test',
    DATABASE_URL: 'postgresql://localhost/main',
    TEST_DATABASE_URL: 'postgresql://localhost/test'
  });

  assert.equal(config.databaseUrl, 'postgresql://localhost/test');
});

test('non-test environments select the main database', () => {
  for (const environment of ['development', 'production']) {
    const config = loadConfig({
      NODE_ENV: environment,
      DATABASE_URL: 'postgresql://localhost/main',
      TEST_DATABASE_URL: 'postgresql://localhost/test'
    });

    assert.equal(config.databaseUrl, 'postgresql://localhost/main');
  }
});

test('rejects unsupported environments', () => {
  assert.throws(
    () => loadConfig({ NODE_ENV: 'staging' }),
    { message: 'Invalid NODE_ENV configuration' }
  );
});

test('freezes exported configuration', () => {
  const config = loadConfig();

  assert.equal(Object.isFrozen(config), true);
});
