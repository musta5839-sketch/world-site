module.exports = (err, req, res, next) => {
  const candidateStatus = Number(err.statusCode || err.status || 500);
  const status =
    Number.isInteger(candidateStatus) &&
    candidateStatus >= 400 &&
    candidateStatus <= 599
      ? candidateStatus
      : 500;

  if (status >= 500) {
    console.error(err);
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const message =
    isProduction && status >= 500
      ? 'INTERNAL_SERVER_ERROR'
      : err.message || 'Internal Server Error';

  res.status(status).json({
    success: false,
    error: message
  });
};
