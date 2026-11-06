const userService = require('./user.service');
const { hashPassword, verifyPassword } = require('../utils/password');

async function register({ email, password, name } = {}) {
  if (
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    typeof name !== 'string' ||
    !email.trim() ||
    !password.trim() ||
    !name.trim()
  ) {
    const error = new Error('Email, password and name are required');
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    const error = new Error('Invalid email address');
    error.statusCode = 400;
    throw error;
  }

  const passwordHash = await hashPassword(password);

  return userService.createUser({
    email: normalizedEmail,
    passwordHash,
    name: name.trim()
  });
}

async function login({ email, password } = {}) {
  if (
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    !email.trim() ||
    !password
  ) {
    const error = new Error('Email and password are required');
    error.statusCode = 400;
    throw error;
  }

  const user = await userService.getUserByEmail(
    email.trim().toLowerCase()
  );

  if (!user) {
    await verifyPassword(password, '$2b$12$r.l02Psxgozp1Lk6VMspMeQOY9l9HE/oveF4bLg88hru4ZGZOPRDy');

    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const validPassword = await verifyPassword(
    password,
    user.password_hash
  );

  if (!validPassword || user.is_active === false) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const { password_hash, ...safeUser } = user;
  return safeUser;
}

module.exports = {
  register,
  login
};
