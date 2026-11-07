const authService = require('../services/auth.service');
const userService = require('../services/user.service');
const { signToken } = require('../utils/token');

async function register(req, res, next) {
  try {
    const user = await authService.register(req.body);

    res.status(201).json({
      status: 'success',
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const user = await authService.login(req.body);
    const token = signToken(user);

    res.status(200).json({
      status: 'success',
      success: true,
      data: {
        user,
        token,
        tokenType: 'Bearer',
        expiresIn: process.env.JWT_EXPIRES_IN || '15m'
      }
    });
  } catch (error) {
    next(error);
  }
}

function me(req, res) {
  res.status(200).json({
    status: 'success',
    success: true,
    data: { user: req.user }
  });
}

async function updateMe(req, res, next) {
  try {
    if (
      !req.body ||
      typeof req.body !== 'object' ||
      Array.isArray(req.body) ||
      Object.keys(req.body).length !== 1 ||
      !Object.prototype.hasOwnProperty.call(req.body, 'name')
    ) {
      const error = new Error('Only the name field can be updated');
      error.statusCode = 400;
      throw error;
    }

    const user = await userService.updateUser(req.user.id, req.body);

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      status: 'success',
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  me,
  updateMe
};
