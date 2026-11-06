module.exports = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'ROUTE_NOT_FOUND'
  });
};
