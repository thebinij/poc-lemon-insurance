import HttpError from './httpError.js';

class ValidationError extends HttpError {
  constructor(message, data = null) {
    super(400, message, data);
  }
}

export default ValidationError;