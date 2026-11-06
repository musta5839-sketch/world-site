const config = require('./config/config');
const { validateTokenConfig } = require('./utils/token');

validateTokenConfig();
const app = require('./app');
const pool = require('./database/pool');
const { startServer } = require('./server/lifecycle');

startServer({ app, config, pool });
