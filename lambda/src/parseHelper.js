const Parse = require('parse/node');

/**
 * Parse Client for Lambda function
 * Simple client with essential Parse operations
 */
const parseClient = {
  /**
   * Update API log entry
   * @param {string} requestId - Request ID
   * @param {string} insuranceType - Insurance type (motor or travel)
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Update result
   */
  async updateAPILog(requestId, insuranceType, updateData) {
    try {
      // Validate insurance type
      if (!['motor', 'travel'].includes(insuranceType.toLowerCase())) {
        throw new Error(`Invalid insurance type: ${insuranceType}. Must be "motor" or "travel"`);
      }
      
      // Get the appropriate class name
      const className = `${insuranceType.charAt(0).toUpperCase() + insuranceType.slice(1)}APILogs`;
      
      // Find the existing log entry
      const query = new Parse.Query(className);
      query.equalTo('requestId', requestId);
      const logEntry = await query.first({ useMasterKey: true });
      
      if (!logEntry) {
        throw new Error(`API log not found for requestId: ${requestId}`);
      }
      
      // Update only allowed fields
      const allowedFields = ['status', 'response', 'responseTime', 'metadata'];
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          logEntry.set(field, updateData[field]);
        }
      }
      
      // Add Lambda-specific metadata
      // logEntry.set('_updatedBy', 'lambda');
      // logEntry.set('_updatedAt', new Date());
      
      // Save the updated log entry
      await logEntry.save(null, { useMasterKey: true });
      
      return {
        success: true,
        message: 'API log updated successfully',
        objectId: logEntry.id
      };
      
    } catch (error) {
      console.error('Error updating API log:', error);
      throw error;
    }
  }
};

module.exports = parseClient;
