const userRepository = require('../repositories/user.repository');

async function createUser({ email, passwordHash, name }) {
  if (
    typeof email !== 'string' ||
    typeof passwordHash !== 'string' ||
    typeof name !== 'string' ||
    !email.trim() ||
    !passwordHash.trim() ||
    !name.trim()
  ) {
    const error = new Error('Valid email, passwordHash and name are required');
    error.statusCode = 400;
    throw error;
  }

  try {
    return await userRepository.create({
      email: email.trim().toLowerCase(),
      passwordHash,
      name: name.trim()
    });
  } catch (error) {
    if (error.code === '23505') {
      const conflict = new Error('Email already exists');
      conflict.statusCode = 409;
      throw conflict;
    }

    throw error;
  }
}

async function getUserById(id) {
  return userRepository.findById(id);
}

async function getUserByEmail(email) {
  if (!email) return null;
  return userRepository.findByEmail(email.trim().toLowerCase());
}

async function updateUser(id, data) {
  const allowedFields = ['name', 'isActive'];

  if (
    !data ||
    typeof data !== 'object' ||
    Array.isArray(data) ||
    Object.keys(data).length === 0 ||
    Object.keys(data).some((key) => !allowedFields.includes(key)) ||
    (
      Object.prototype.hasOwnProperty.call(data, 'name') &&
      (typeof data.name !== 'string' || !data.name.trim())
    ) ||
    (
      Object.prototype.hasOwnProperty.call(data, 'isActive') &&
      typeof data.isActive !== 'boolean'
    )
  ) {
    const error = new Error('Invalid user update data');
    error.statusCode = 400;
    throw error;
  }

  const updates = {};

  if (Object.prototype.hasOwnProperty.call(data, 'name')) {
    updates.name = data.name.trim();
  }

  if (Object.prototype.hasOwnProperty.call(data, 'isActive')) {
    updates.isActive = data.isActive;
  }

  return userRepository.updateById(id, updates);
}

async function deleteUser(id) {
  return userRepository.deleteById(id);
}

module.exports = {
  createUser,
  getUserById,
  getUserByEmail,
  updateUser,
  deleteUser
};
