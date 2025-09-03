import Parse from 'parse/node.js';
import config from '../config/environment.js';
import AuthError from '../errors/authErrror.js';

// Initialize Parse client for middleware
Parse.initialize(config.parse.appId, config.parse.jsKey, config.parse.masterKey);
Parse.serverURL = config.parse.serverUrl;

// Set main server service identification headers for cloud code
Parse.Cloud.useMasterKey = true;
Parse.Cloud.httpRequest = function(options) {
  options.headers = options.headers || {};
  options.headers['x-service-type'] = 'main-server';
  options.headers['user-agent'] = 'main-baas-server';
  return Parse.Cloud.httpRequest(options);
};

/**
 * Authentication middleware
 * Validates session tokens and adds user context to request
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Skip authentication for health checks and public endpoints
    if (req.path === '/health' || req.path.startsWith('/health/')) {
      return next();
    }

    // Extract session token from various sources
    const sessionToken = extractSessionToken(req);
    
    if (!sessionToken) {
      throw new AuthError('Session token is required');
    }

    // Validate session using Parse Server cloud code
    const user = await validateSession(sessionToken);
    
    if (!user) {
      throw new AuthError('Invalid or expired session token');
    }

    // Add user context to request
    req.user = {
      id: user.id,
      email: user.get('email'),
      insuranceType: user.get('insuranceType'),
      status: user.get('status'),
      sessionToken: sessionToken
    };

    // Add service identification for cloud code
    req.headers['x-service-type'] = 'main-server';
    req.headers['user-agent'] = 'main-baas-server';

    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    next(error);
  }
};

/**
 * Extract session token from request
 */
function extractSessionToken(req) {
  // Check body for sessionToken
  if (req.body && req.body.sessionToken) {
    return req.body.sessionToken;
  }

  // Check query parameters
  if (req.query && req.query.sessionToken) {
    return req.query.sessionToken;
  }

  return null;
}

/**
 * Validate session token using Parse Server
 */
async function validateSession(sessionToken) {
  try {
    const sessionQuery = new Parse.Query('_Session');
    sessionQuery.equalTo('sessionToken', sessionToken);
    sessionQuery.include('user');
    
    const session = await sessionQuery.first({ useMasterKey: true });
    
    if (!session) {
      return null;
    }

    // Check if session is expired
    const expiresAt = session.get('expiresAt');
    if (expiresAt && expiresAt < new Date()) {
      return null;
    }

    // Check if session is restricted
    if (session.get('restricted')) {
      return null;
    }

    return session.get('user');
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}


export {
  //  Authentication Middleware
  authMiddleware,
  
  // Utility functions
  extractSessionToken,
  validateSession
};
