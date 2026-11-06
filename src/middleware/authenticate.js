const { verifyToken } = require('../utils/token');
const userService = require('../services/user.service');

module.exports = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith('Bearer ')) {
      const error = new Error('Authentication required');
      error.statusCode = 401;
      throw error;
    }

    const token = authorization.slice(7).trim();

    if (!token) {
      const error = new Error('Authentication required');
      error.statusCode = 401;
      throw error;
    }

    const payload = verifyToken(token);
    const user = await userService.getUserById(payload.sub);

    if (!user || user.is_active === false) {
      const error = new Error('Invalid or inactive user');
      error.statusCode = 401;
      throw error;
    }

    const {
      password_hash,
      ...safeUser
    } = user;

    req.user = safeUser;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' ||
        error.name === 'TokenExpiredError' ||
        error.name === 'NotBeforeError') {
      error.statusCode = 401;
      error.message = 'Invalid or expired token';
    }

    next(error);
  }
};
