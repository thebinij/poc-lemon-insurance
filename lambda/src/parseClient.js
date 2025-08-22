const Parse = require('parse/node');

/**
 * Parse Client for Lambda functions
 * This allows Lambda functions to interact with Parse Server
 */
class ParseClient {
  constructor() {
    // Initialize Parse with server configuration
    Parse.initialize(
      process.env.PARSE_APP_ID || 'lemon-insurance-app-id',
      process.env.PARSE_JS_KEY || 'lemon-insurance-js-key',
      process.env.PARSE_MASTER_KEY || 'lemon-insurance-master-key'
    );

    Parse.serverURL = process.env.PARSE_SERVER_URL || 'http://localhost:1337/parse';
    
    // Extend Parse classes
    this.User = Parse.Object.extend('User');
    this.AuthEvent = Parse.Object.extend('AuthEvent');
    this.InsuranceEvent = Parse.Object.extend('InsuranceEvent');
    this.Workflow = Parse.Object.extend('Workflow');
    
    console.log('✅ Parse Client initialized');
  }

  /**
   * Update insurance event status in Parse Server
   * @param {string} eventId - Event ID
   * @param {string} status - New status
   * @param {string} lambdaRequestId - Lambda request ID
   * @returns {Promise<void>}
   */
  async updateInsuranceEventStatus(eventId, status, lambdaRequestId) {
    try {
      const query = new Parse.Query(this.InsuranceEvent);
      const event = await query.get(eventId, { useMasterKey: true });
      
      if (event) {
        event.set('status', status);
        event.set('processedAt', new Date());
        event.set('lambdaRequestId', lambdaRequestId);
        await event.save(null, { useMasterKey: true });
        
        console.log(`✅ Insurance event status updated in Parse: ${eventId} -> ${status}`);
      } else {
        console.warn(`⚠️ Insurance event not found: ${eventId}`);
      }
    } catch (error) {
      console.error('❌ Error updating insurance event status in Parse:', error);
      throw error;
    }
  }

  /**
   * Update auth event status in Parse Server (kept for backward compatibility)
   * @param {string} eventId - Event ID
   * @param {string} status - New status
   * @param {string} lambdaRequestId - Lambda request ID
   * @returns {Promise<void>}
   */
  async updateAuthEventStatus(eventId, status, lambdaRequestId) {
    try {
      const query = new Parse.Query(this.AuthEvent);
      const event = await query.get(eventId, { useMasterKey: true });
      
      if (event) {
        event.set('status', status);
        event.set('processedAt', new Date());
        event.set('lambdaRequestId', lambdaRequestId);
        await event.save(null, { useMasterKey: true });
        
        console.log(`✅ Auth event status updated in Parse: ${eventId} -> ${status}`);
      } else {
        console.warn(`⚠️ Auth event not found: ${eventId}`);
      }
    } catch (error) {
      console.error('❌ Error updating auth event status in Parse:', error);
      throw error;
    }
  }

  /**
   * Create a workflow record in Parse Server
   * @param {Object} workflowData - Workflow data
   * @returns {Promise<Parse.Object>} - Created workflow object
   */
  async createWorkflow(workflowData) {
    try {
      const workflow = new this.Workflow();
      
      workflow.set('name', workflowData.name);
      workflow.set('status', workflowData.status || 'pending');
      
      // Handle both auth and insurance workflows
      if (workflowData.userId) {
        workflow.set('userId', workflowData.userId);
      }
      if (workflowData.requestId) {
        workflow.set('requestId', workflowData.requestId);
      }
      
      workflow.set('data', workflowData.data || {});
      workflow.set('createdAt', new Date());
      workflow.set('updatedAt', new Date());

      const savedWorkflow = await workflow.save(null, { useMasterKey: true });
      
      console.log(`✅ Workflow created in Parse: ${savedWorkflow.id}`);
      return savedWorkflow;
      
    } catch (error) {
      console.error('❌ Error creating workflow in Parse:', error);
      throw error;
    }
  }

  /**
   * Update workflow status in Parse Server
   * @param {string} workflowId - Workflow ID
   * @param {string} status - New status
   * @param {Object} data - Additional data
   * @returns {Promise<void>}
   */
  async updateWorkflowStatus(workflowId, status, data = {}) {
    try {
      const query = new Parse.Query(this.Workflow);
      const workflow = await query.get(workflowId, { useMasterKey: true });
      
      if (workflow) {
        workflow.set('status', status);
        workflow.set('updatedAt', new Date());
        
        // Merge additional data
        const currentData = workflow.get('data') || {};
        workflow.set('data', { ...currentData, ...data });
        
        await workflow.save(null, { useMasterKey: true });
        
        console.log(`✅ Workflow status updated in Parse: ${workflowId} -> ${status}`);
      } else {
        console.warn(`⚠️ Workflow not found: ${workflowId}`);
      }
    } catch (error) {
      console.error('❌ Error updating workflow status in Parse:', error);
      throw error;
    }
  }

  /**
   * Get user information from Parse Server
   * @param {string} userId - User ID
   * @returns {Promise<Parse.Object|null>} - User object or null
   */
  async getUser(userId) {
    try {
      const query = new Parse.Query(this.User);
      const user = await query.get(userId, { useMasterKey: true });
      return user;
    } catch (error) {
      console.error('❌ Error getting user from Parse:', error);
      return null;
    }
  }

  /**
   * Get auth events by status from Parse Server
   * @param {string} status - Event status
   * @param {number} limit - Maximum number of events
   * @returns {Promise<Parse.Object[]>} - Array of events
   */
  async getAuthEventsByStatus(status, limit = 100) {
    try {
      const query = new Parse.Query(this.AuthEvent);
      query.equalTo('status', status);
      query.descending('timestamp');
      query.limit(limit);
      
      const events = await query.find({ useMasterKey: true });
      return events;
    } catch (error) {
      console.error('❌ Error getting auth events from Parse:', error);
      return [];
    }
  }

  /**
   * Create a custom collection record
   * @param {string} className - Collection name
   * @param {Object} data - Data to store
   * @returns {Promise<Parse.Object>} - Created object
   */
  async createCustomRecord(className, data) {
    try {
      const CustomClass = Parse.Object.extend(className);
      const record = new CustomClass();
      
      // Set all data fields
      Object.keys(data).forEach(key => {
        record.set(key, data[key]);
      });
      
      // Add metadata
      record.set('createdAt', new Date());
      record.set('updatedAt', new Date());
      record.set('source', 'lambda-function');
      record.set('lambdaRequestId', data.lambdaRequestId || 'unknown');

      const savedRecord = await record.save(null, { useMasterKey: true });
      
      console.log(`✅ Custom record created in Parse: ${className} - ${savedRecord.id}`);
      return savedRecord;
      
    } catch (error) {
      console.error(`❌ Error creating custom record in Parse (${className}):`, error);
      throw error;
    }
  }

  /**
   * Query custom collection
   * @param {string} className - Collection name
   * @param {Object} filters - Query filters
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Parse.Object[]>} - Array of objects
   */
  async queryCustomCollection(className, filters = {}, limit = 100) {
    try {
      const CustomClass = Parse.Object.extend(className);
      const query = new Parse.Query(CustomClass);
      
      // Apply filters
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null) {
          query.equalTo(key, filters[key]);
        }
      });
      
      query.limit(limit);
      query.descending('createdAt');
      
      const results = await query.find({ useMasterKey: true });
      return results;
      
    } catch (error) {
      console.error(`❌ Error querying custom collection in Parse (${className}):`, error);
      return [];
    }
  }
}

module.exports = ParseClient;
