exports.health = (req, res) => {
  res.status(200).json({
    success: true,
    application: 'WORLD',
    status: 'online',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
};
