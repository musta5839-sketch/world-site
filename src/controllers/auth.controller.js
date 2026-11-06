const authService = require('../services/auth.service');
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

module.exports = {
  register,
  login,
  me
};
