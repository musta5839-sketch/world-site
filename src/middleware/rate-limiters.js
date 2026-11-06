const rateLimit = require('express-rate-limit');

const WINDOW_MS = 15 * 60 * 1000;

function createRateLimiter(options = {}) {
  return rateLimit({
    windowMs: WINDOW_MS,
    limit: options.limit ?? 100,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
      status: 'error',
      success: false,
      message: 'Too many requests. Please try again later.'
    },
    ...options
  });
}

const apiLimiter = createRateLimiter({
  limit: 100,
  skip: (req) => req.path === '/auth' || req.path.startsWith('/auth/')
});

const authLimiter = createRateLimiter({
  limit: 10
});

module.exports = {
  createRateLimiter,
  apiLimiter,
  authLimiter
};
