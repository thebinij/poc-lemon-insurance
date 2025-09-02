const Parse = require('parse/node');
const config = require('../config/environment');

// Initialize Parse with centralized configuration
Parse.initialize(
  config.parse.appId,
  config.parse.jsKey,
  config.parse.masterKey
);

Parse.serverURL = config.parse.serverUrl;

/**
 * Parse Service for API logging
 */
class ParseService {
  constructor() {
    this.MotorAPILogs = Parse.Object.extend('MotorAPILogs');
    this.TravelAPILogs = Parse.Object.extend('TravelAPILogs');
  }

  /**
   * Get the appropriate API log class based on insurance type
   * @param {string} insuranceType - Insurance type (motor, travel)
   * @returns {Parse.Object} - Parse class for the insurance type
   */
  getAPILogClass(insuranceType) {
    switch (insuranceType.toLowerCase()) {
      case 'motor':
        return this.MotorAPILogs;
      case 'travel':
        return this.TravelAPILogs;
      default:
        throw new Error(`Unsupported insurance type: ${insuranceType}`);
    }
  }

  /**
   * Log API call to the appropriate table
   * @param {Object} logData - API call data
   * @returns {Promise<Parse.Object>} - Created log object
   */
  async logAPICall(logData) {
    try {
      const LogClass = this.getAPILogClass(logData.insuranceType);
      const logEntry = new LogClass();
      
      logEntry.set('userId', logData.userId);
      logEntry.set('requestId', logData.requestId);
      logEntry.set('endpoint', logData.endpoint);
      logEntry.set('step', logData.step);
      logEntry.set('method', logData.method || 'POST');
      logEntry.set('status', 'pending');
      logEntry.set('request', logData.request || {});
      logEntry.set('response', {});
      logEntry.set('headers', logData.headers || {});
      logEntry.set('metadata', {
        insuranceType: logData.insuranceType,
        environment: config.server.nodeEnv
      });
      logEntry.set('responseTime', 0);
      logEntry.set('ipAddress', logData.ipAddress || '');
      logEntry.set('userAgent', logData.userAgent || '');
      logEntry.set('timestamp', new Date());

      // Set ACL - only the user and admin role can access this record
      const acl = new Parse.ACL();
      acl.setPublicReadAccess(false);
      acl.setPublicWriteAccess(false);
      
      // Set user-specific access if userId is provided and not 'anonymous'
      if (logData.userId && logData.userId !== 'anonymous') {
        acl.setReadAccess(logData.userId, true);
        acl.setWriteAccess(logData.userId, true);
      }
      
      // Admin role always has access
      // acl.setRoleReadAccess('admin', true);
      // acl.setRoleWriteAccess('admin', true);
      
      logEntry.setACL(acl);

      const savedLog = await logEntry.save(null, { useMasterKey: true });
      
      console.log(`✅ API call logged: ${savedLog.id} (${logData.insuranceType}) - ACL set for user: ${logData.userId}`);
      return savedLog;
      
    } catch (error) {
      console.error('❌ Error logging API call:', error);
      throw error;
    }
  }

  /**
   * Update API log with response data
   * @param {string} requestId - Request ID
   * @param {string} insuranceType - Insurance type (motor, travel)
   * @param {Object} updateData - Data to update
   * @returns {Promise<void>}
   */
  async updateAPILog(requestId, insuranceType, updateData) {
    try {
      const LogClass = this.getAPILogClass(insuranceType);
      const query = new Parse.Query(LogClass);
      query.equalTo('requestId', requestId);
      
      const logEntry = await query.first({ useMasterKey: true });
      
      if (logEntry) {
        if (updateData.status) logEntry.set('status', updateData.status);
        if (updateData.response) logEntry.set('response', updateData.response);
        if (updateData.responseTime) logEntry.set('responseTime', updateData.responseTime);
        if (updateData.metadata) logEntry.set('metadata', updateData.metadata);
        
        await logEntry.save(null, { useMasterKey: true });
        console.log(`✅ API log updated: ${requestId} (${insuranceType})`);
      } else {
        console.warn(`⚠️ API log not found for requestId: ${requestId} in ${insuranceType} table`);
      }
      
    } catch (error) {
      console.error('❌ Error updating API log:', error);
      throw error;
    }
  }

  /**
   * Create new user and establish session using Parse's _User and _Session
   * @param {Object} userData - User data (no userId - backend generates it)
   * @returns {Promise<Object>} - User and session info
   */
  async createUser(userData) {
    try {
      const { insuranceType, email, phone, name, ipAddress, userAgent } = userData;
      
      const user = new Parse.Object('_User');
      const username = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const password = `temp_${Math.random().toString(36).substr(2, 16)}`;
      
      user.set('username', username);
      user.set('password', password);
      user.set('email', email || `${username}@temp.com`);
      user.set('insuranceType', insuranceType);
      user.set('phone', phone);
      user.set('name', name);
      user.set('status', 'active');
      user.set('metadata', {
        createdVia: 'insurance-api',
        ipAddress: ipAddress,
        userAgent: userAgent,
        createdAt: new Date()
      });
      
      // Set initial ACL
      const userACL = new Parse.ACL();
      userACL.setPublicReadAccess(false);
      userACL.setPublicWriteAccess(false);
      // userACL.setRoleReadAccess('admin', true);
      // userACL.setRoleWriteAccess('admin', true);
      
      user.setACL(userACL);
      
      await user.save(null, { useMasterKey: true });
      
      // After saving, set user-specific ACL using the generated objectId
      const finalACL = new Parse.ACL();
      finalACL.setPublicReadAccess(false);
      finalACL.setPublicWriteAccess(false);
      finalACL.setReadAccess(user.id, true);
      finalACL.setWriteAccess(user.id, true);
      // finalACL.setRoleReadAccess('admin', true);
      // finalACL.setRoleWriteAccess('admin', true);
      
      user.setACL(finalACL);
      await user.save(null, { useMasterKey: true });
      
      console.log(`✅ New user created in _User: ${user.id} (${insuranceType})`);
      
      // Create session for this user in _Session class
      const sessionToken = await this.createUserSession(user, insuranceType, { ipAddress, userAgent });
      
      return {
        user: user,
        userId: user.id, 
        sessionToken: sessionToken,
        isNewUser: true
      };
      
    } catch (error) {
      console.error('❌ Error creating user:', error);
      throw error;
    }
  }

  /**
   * Create user session using Parse's _Session class
   * @param {Parse.Object} user - Parse User object from _User class
   * @param {string} insuranceType - Insurance type
   * @param {Object} sessionData - Additional session data
   * @returns {Promise<string>} - Session token
   */
  async createUserSession(user, insuranceType, sessionData = {}) {
    try {
      const session = new Parse.Object('_Session');
      const sessionToken = `r:${Math.random().toString(36).slice(2, 32)}`;
      
      session.set('user', user);
      session.set('sessionToken', sessionToken);
      session.set('installationId', `insurance_${insuranceType}_${Date.now()}`);
      session.set('restricted', false);
      session.set('expiresAt', new Date(Date.now() + 24 * 60 * 60 * 1000)); // 24 hours
      session.set('createdWith', {
        action: 'insurance-api',
        authProvider: 'anonymous',
        insuranceType: insuranceType
      });
      
      // Add custom metadata
      session.set('metadata', {
        insuranceType: insuranceType,
        ipAddress: sessionData.ipAddress,
        userAgent: sessionData.userAgent,
        createdAt: new Date()
      });
      
      const savedSession = await session.save(null, { useMasterKey: true });
      
      console.log(`✅ Session created in _Session: ${savedSession.id} for user: ${user.id}`);
      return sessionToken;
      
    } catch (error) {
      console.error('❌ Error creating user session:', error);
      throw error;
    }
  }

  /**
   * Get user by session token from _Session class
   * @param {string} sessionToken - Session token
   * @returns {Promise<Parse.Object|null>} - User object or null
   */
  async getUserBySessionToken(sessionToken) {
    try {
      const sessionQuery = new Parse.Query('_Session');
      sessionQuery.equalTo('sessionToken', sessionToken);
      sessionQuery.include('user');
      
      const session = await sessionQuery.first({ useMasterKey: true });
      
      if (session && session.get('expiresAt') > new Date()) {
        return session.get('user');
      }
      
      return null;
      
    } catch (error) {
      console.error('❌ Error getting user by session token:', error);
      return null;
    }
  }
  async getAPILogs(insuranceType, limit = 100) {
    try {
      const LogClass = this.getAPILogClass(insuranceType);
      const query = new Parse.Query(LogClass);
      query.descending('timestamp');
      query.limit(limit);
      
      const logs = await query.find({ useMasterKey: true });
      return logs;
      
    } catch (error) {
      console.error('❌ Error getting API logs:', error);
      throw error;
    }
  }

  /**
   * Get API logs by user ID
   * @param {string} userId - User ID
   * @param {string} insuranceType - Insurance type
   * @param {number} limit - Maximum number of logs to return
   * @returns {Promise<Parse.Object[]>} - Array of log entries
   */
  async getAPILogsByUser(userId, insuranceType, limit = 100) {
    try {
      const LogClass = this.getAPILogClass(insuranceType);
      const query = new Parse.Query(LogClass);
      query.equalTo('userId', userId);
      query.descending('timestamp');
      query.limit(limit);
      
      const logs = await query.find({ useMasterKey: true });
      return logs;
      
    } catch (error) {
      console.error('❌ Error getting API logs by user:', error);
      throw error;
    }
  }

  /**
   * Get API log by request ID
   * @param {string} requestId - Request ID
   * @param {string} insuranceType - Insurance type
   * @returns {Promise<Parse.Object|null>} - Log entry or null
   */
  async getAPILogByRequestId(requestId, insuranceType) {
    try {
      const LogClass = this.getAPILogClass(insuranceType);
      const query = new Parse.Query(LogClass);
      query.equalTo('requestId', requestId);
      
      const logEntry = await query.first({ useMasterKey: true });
      return logEntry;
      
    } catch (error) {
      console.error('❌ Error getting API log by request ID:', error);
      throw error;
    }
  }
}

module.exports = new ParseService();