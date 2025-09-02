const HttpError = require('./httpError');

class ValidationError extends HttpError {
  constructor(message, data = null) {
    super(400, message, data);
  }
}

module.exports = ValidationError;