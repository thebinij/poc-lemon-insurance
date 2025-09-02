const HttpError = require('./httpError');

class AuthError extends HttpError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

module.exports = AuthError;