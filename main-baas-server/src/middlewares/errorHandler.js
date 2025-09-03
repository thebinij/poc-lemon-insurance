import HttpError from '../errors/httpError.js';

function errorHandler(err, req, res, next) {
  console.error(err); // always log for debugging

  // If it's a known HttpError (ValidationError, AuthError, etc.)
  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.data ? { data: err.data } : {})
    });
  }

  // For unhandled errors
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
}

export default errorHandler;