const errorHandler = (err, req, res, next) => {
  console.error('Error encountered:', err);

  // MongoDB Duplicate Key Error (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `A record with this ${field} already exists.`
    });
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors || {}).map(e => e.message);
    return res.status(422).json({
      success: false,
      message: messages.join(', ') || 'Validation failed',
      errors: err.errors
    });
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid identifier format: ${err.value}`
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Something went wrong. Please try again.';

  return res.status(statusCode).json({
    success: false,
    message
  });
};

module.exports = errorHandler;
