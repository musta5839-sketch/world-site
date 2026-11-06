const config = require('./config/config');

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const notFound = require('./middleware/not-found');
const errorHandler = require('./middleware/error-handler');

const app = express();
const authRoutes = require('./routes/auth.routes');

app.disable('x-powered-by');

app.use(helmet({
  crossOriginResourcePolicy: {
    policy: 'same-origin'
  }
}));

app.use(cors({
  origin: config.environment === 'development'
}));

app.use(express.json({
  limit: '1mb'
}));

app.use(express.urlencoded({
  extended: false,
  limit: '1mb'
}));

if (config.environment !== 'test') {
  app.use(morgan('dev'));
}

app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false
}));

app.use('/api/auth', authRoutes);

app.use('/api/health', require('./routes/health.routes'));
app.use('/api/ready', require('./routes/readiness.routes'));

app.use(express.static(
  path.join(__dirname, '..', 'public')
));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
