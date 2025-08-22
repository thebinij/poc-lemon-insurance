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
 * Parse Service for insurance event tracking
 * Business logic for different insurance types handled by Lambda
 */
class ParseService {
  constructor() {
    this.InsuranceEvent = Parse.Object.extend('InsuranceEvent');
    this.InsurancePolicy = Parse.Object.extend('InsurancePolicy');
    this.InsuranceClaim = Parse.Object.extend('InsuranceClaim');
    this.Customer = Parse.Object.extend('Customer');
  }

  /**
   * Create insurance event record for tracking
   * @param {Object} eventData - Event data with insurance type
   * @returns {Promise<Parse.Object>} - Created event object
   */
  async createInsuranceEvent(eventData) {
    try {
      const event = new this.InsuranceEvent();
      
      event.set('eventType', eventData.eventType);
      event.set('requestId', eventData.requestId);
      event.set('insuranceType', eventData.insuranceType); // motor, travel, etc.
      event.set('data', eventData.data);
      event.set('status', 'pending');
      event.set('timestamp', new Date());
      event.set('metadata', {
        source: 'main-baas-server',
        createdAt: new Date(),
        insuranceType: eventData.insuranceType
      });

      const savedEvent = await event.save(null, { useMasterKey: true });
      
      console.log(`✅ Insurance event created: ${savedEvent.id} (${eventData.insuranceType})`);
      return savedEvent;
      
    } catch (error) {
      console.error('❌ Error creating insurance event:', error);
      throw error;
    }
  }

  /**
   * Update event status after Lambda processing
   * @param {string} eventId - Event ID
   * @param {string} status - New status
   * @param {Object} result - Processing result
   * @returns {Promise<void>}
   */
  async updateEventStatus(eventId, status, result = {}) {
    try {
      const query = new Parse.Query(this.InsuranceEvent);
      const event = await query.get(eventId, { useMasterKey: true });
      
      if (event) {
        event.set('status', status);
        event.set('processedAt', new Date());
        event.set('result', result);
        await event.save(null, { useMasterKey: true });
        
        console.log(`✅ Event status updated: ${eventId} -> ${status}`);
      }
    } catch (error) {
      console.error('❌ Error updating event status:', error);
      throw error;
    }
  }

  /**
   * Get event by ID
   * @param {string} eventId - Event ID
   * @returns {Promise<Parse.Object|null>} - Event object or null
   */
  async getEvent(eventId) {
    try {
      const query = new Parse.Query(this.InsuranceEvent);
      const event = await query.get(eventId, { useMasterKey: true });
      return event;
      
    } catch (error) {
      console.error('❌ Error getting event:', error);
      throw error;
    }
  }

  /**
   * Get events by insurance type
   * @param {string} insuranceType - Insurance type filter
   * @param {number} limit - Maximum number of events to return
   * @returns {Promise<Parse.Object[]>} - Array of events
   */
  async getEventsByType(insuranceType, limit = 100) {
    try {
      const query = new Parse.Query(this.InsuranceEvent);
      query.equalTo('insuranceType', insuranceType);
      query.descending('timestamp');
      query.limit(limit);
      
      const events = await query.find({ useMasterKey: true });
      return events;
      
    } catch (error) {
      console.error('❌ Error getting events by type:', error);
      throw error;
    }
  }

  /**
   * Get events by status
   * @param {string} status - Event status filter
   * @param {number} limit - Maximum number of events to return
   * @returns {Promise<Parse.Object[]>} - Array of events
   */
  async getEventsByStatus(status, limit = 100) {
    try {
      const query = new Parse.Query(this.InsuranceEvent);
      query.equalTo('status', status);
      query.descending('timestamp');
      query.limit(limit);
      
      const events = await query.find({ useMasterKey: true });
      return events;
      
    } catch (error) {
      console.error('❌ Error getting events by status:', error);
      throw error;
    }
  }

  /**
   * Get all events with pagination
   * @param {number} skip - Number of events to skip
   * @param {number} limit - Maximum number of events to return
   * @returns {Promise<Parse.Object[]>} - Array of events
   */
  async getAllEvents(skip = 0, limit = 100) {
    try {
      const query = new Parse.Query(this.InsuranceEvent);
      query.descending('timestamp');
      query.skip(skip);
      query.limit(limit);
      
      const events = await query.find({ useMasterKey: true });
      return events;
      
    } catch (error) {
      console.error('❌ Error getting all events:', error);
      throw error;
    }
  }
}

module.exports = new ParseService();
