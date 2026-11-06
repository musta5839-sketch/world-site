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
  return userRepository.updateById(id, data);
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
