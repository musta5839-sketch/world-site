exports.up = (pgm) => {
  pgm.dropIndex('users', 'email', {
    name: 'users_email_idx',
    ifExists: true
  });
};

exports.down = (pgm) => {
  pgm.createIndex('users', 'email', {
    name: 'users_email_idx'
  });
};
