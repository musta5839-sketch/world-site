const { Pool } = require('pg');
const config = require('../config/config');

function createPool(PoolClass = Pool, settings = config) {
  if (!settings.databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  const pool = new PoolClass({
    connectionString: settings.databaseUrl,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ssl: settings.environment === 'production'
      ? { rejectUnauthorized: true }
      : false
  });

  pool.on('error', (error) => {
    console.error('Unexpected PostgreSQL pool error:', error);
  });

  return pool;
}

const pool = createPool();

module.exports = pool;
module.exports.createPool = createPool;
