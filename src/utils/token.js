const jwt = require('jsonwebtoken');

function getSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }

  return secret;
}

function getTokenOptions() {
  return {
    algorithm: 'HS256',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    issuer: 'world-site',
    audience: 'world-site-client'
  };
}

function validateTokenConfig() {
  jwt.sign(
    { sub: 'startup-validation' },
    getSecret(),
    getTokenOptions()
  );
}

function signToken(user) {
  return jwt.sign(
    { sub: user.id },
    getSecret(),
    getTokenOptions()
  );
}

function verifyToken(token) {
  return jwt.verify(token, getSecret(), {
    algorithms: ['HS256'],
    issuer: 'world-site',
    audience: 'world-site-client'
  });
}

module.exports = { signToken, verifyToken, validateTokenConfig };
