require('dotenv').config();

const port = Number(process.env.PORT || 3000);
const environment = process.env.NODE_ENV || 'development';

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('Invalid PORT configuration');
}

if (!['development', 'production', 'test'].includes(environment)) {
  throw new Error('Invalid NODE_ENV configuration');
}

module.exports = Object.freeze({
  port,
  environment,
  databaseUrl: environment === 'test'
    ? process.env.TEST_DATABASE_URL
    : process.env.DATABASE_URL
});
