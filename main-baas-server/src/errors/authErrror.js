import HttpError from './httpError.js';

class AuthError extends HttpError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

export default AuthError;