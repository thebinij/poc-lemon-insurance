import Parse from 'parse/node.js';
import config from '../config/environment.js';

// Initialize Parse with centralized configuration
Parse.initialize(
  config.parse.appId,
  config.parse.jsKey,
  config.parse.masterKey
);

Parse.serverURL = config.parse.serverUrl;

// Set main server-specific headers for service identification
Parse.Cloud.useMasterKey = true;
Parse.Cloud.httpRequest = function(options) {
  // Add main server service identification headers
  options.headers = options.headers || {};
  options.headers['x-service-type'] = 'main-server';
  options.headers['user-agent'] = 'main-baas-server';
  
  return Parse.Cloud.httpRequest(options);
};

/**
 * Get service permissions from cloud code
 */
async function getServicePermissions() {
  try {
    return await Parse.Cloud.run('getServicePermissions');
  } catch (error) {
    console.error('Error getting service permissions:', error);
    return null;
  }
}

/**
 * Parse Service - calls cloud functions
 * All business logic is now in Parse Server cloud code
 */
class ParseService {
  /**
   * Create new user using cloud function
   * @param {Object} userData - User data
   * @returns {Promise<Object>} - User and session info
   */
  async createUser(userData) {
    try {
      const result = await Parse.Cloud.run('createUser', userData);
      
      if (result.success) {
        console.log(`User created via cloud function: ${result.user.id}`);
        return {
          user: result.user,
          userId: result.user.id,
          sessionToken: result.sessionToken,
          isNewUser: result.isNewUser
        };
      } else {
        throw new Error('Failed to create user via cloud function');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Log API call using cloud function
   * @param {Object} logData - API call data
   * @returns {Promise<Object>} - Log result
   */
  async logAPICall(logData) {
    try {
      const result = await Parse.Cloud.run('logAPICall', logData);
      
      if (result.success) {
        console.log(`API call logged via cloud function: ${result.logId}`);
        return result;
      } else {
        throw new Error('Failed to log API call via cloud function');
      }
    } catch (error) {
      console.error('Error logging API call:', error);
      throw error;
    }
  }

  /**
   * Update API log using cloud function
   * @param {string} requestId - Request ID
   * @param {string} insuranceType - Insurance type
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Update result
   */
  async updateAPILog(requestId, insuranceType, updateData) {
    try {
      const result = await Parse.Cloud.run('updateAPILog', {
        requestId,
        insuranceType,
        updateData
      });
      
      if (result.success) {
        console.log(`API log updated via cloud function: ${requestId}`);
        return result;
      } else {
        throw new Error('Failed to update API log via cloud function');
      }
    } catch (error) {
      console.error('Error updating API log:', error);
      throw error;
    }
  }

  /**
   * Get user by session token using cloud function
   * @param {string} sessionToken - Session token
   * @returns {Promise<Object|null>} - User object or null
   */
  async getUserBySessionToken(sessionToken) {
    try {
      const result = await Parse.Cloud.run('getUserBySessionToken', { sessionToken });
      
      if (result.success) {
        console.log(`User retrieved via cloud function: ${result.user.id}`);
        return result.user;
      } else {
        console.log('User not found or session invalid');
        return null;
      }
    } catch (error) {
      console.error('Error getting user by session token:', error);
      return null;
    }
  }
  /**
   * Get API log by request ID (simple query for POC)
   * @param {string} requestId - Request ID
   * @param {string} insuranceType - Insurance type
   * @returns {Promise<Parse.Object|null>} - Log entry or null
   */
  async getAPILogByRequestId(requestId, insuranceType) {
    try {
      const className = `${insuranceType.charAt(0).toUpperCase() + insuranceType.slice(1)}APILogs`;
      const LogClass = Parse.Object.extend(className);
      const query = new Parse.Query(LogClass);
      query.equalTo('requestId', requestId);
      
      const logEntry = await query.first({ useMasterKey: true });
      return logEntry;
      
    } catch (error) {
      console.error('Error getting API log by request ID:', error);
      throw error;
    }
  }

  /**
   * Get service permissions from cloud code
   * @returns {Promise<Object|null>} - Service permissions or null
   */
  async getServicePermissions() {
    return await getServicePermissions();
  }
}

export default new ParseService();