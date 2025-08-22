const { SQSClient, SendMessageCommand, CreateQueueCommand, GetQueueAttributesCommand } = require('@aws-sdk/client-sqs');
const config = require('../config/environment');

// Initialize SQS client with centralized config
const sqsClient = new SQSClient(config.getAwsConfig());

/**
 * Publish a message to SQS
 * @param {Object} message - The message to publish
 * @returns {Promise<Object>} - SQS send result
 */
async function publishToSQS(message) {
  try {
    // Ensure queue exists before publishing
    await ensureQueueExists();

    const params = {
      QueueUrl: config.getSqsQueueUrl(),
      MessageBody: JSON.stringify(message),
      MessageAttributes: {
        'EventType': {
          DataType: 'String',
          StringValue: message.eventType
        },
        'InsuranceType': {
          DataType: 'String',
          StringValue: message.insuranceType || 'general'
        },
        'RequestId': {
          DataType: 'String',
          StringValue: message.requestId
        },
        'Timestamp': {
          DataType: 'String',
          StringValue: message.timestamp
        }
      }
    };

    console.log(`📤 Publishing to SQS: ${message.eventType} for ${message.insuranceType} insurance`);
    
    const command = new SendMessageCommand(params);
    const result = await sqsClient.send(command);
    
    console.log(`✅ Message sent to SQS successfully. MessageId: ${result.MessageId}`);
    
    return result;
  } catch (error) {
    console.error('❌ Error publishing to SQS:', error);
    
    // For local development, don't fail the request if SQS is not available
    if (config.isDevelopment()) {
      console.log('⚠️ SQS not available in local development, continuing without queuing...');
      return { MessageId: 'local-dev-skip' };
    }
    
    throw error;
  }
}

/**
 * Create the SQS queue if it doesn't exist (useful for local development)
 */
async function ensureQueueExists() {
  try {
    if (config.isDevelopment()) {
      const params = {
        QueueName: config.sqs.queueName,
        Attributes: {
          'VisibilityTimeout': config.sqs.visibilityTimeout.toString(),
          'MessageRetentionPeriod': config.sqs.messageRetentionPeriod.toString(),
          'MaximumMessageSize': config.sqs.maximumMessageSize.toString()
        }
      };

      const command = new CreateQueueCommand(params);
      await sqsClient.send(command);
      console.log(`✅ SQS queue '${config.sqs.queueName}' created/verified successfully`);
    }
  } catch (error) {
    console.error('❌ Error ensuring SQS queue exists:', error);
    // Don't throw error as this is just a convenience function
  }
}

/**
 * Get queue attributes
 */
async function getQueueAttributes() {
  try {
    const params = {
      QueueUrl: config.getSqsQueueUrl(),
      AttributeNames: ['All']
    };

    const command = new GetQueueAttributesCommand(params);
    const result = await sqsClient.send(command);
    return result.Attributes;
  } catch (error) {
    console.error('❌ Error getting queue attributes:', error);
    throw error;
  }
}

module.exports = {
  publishToSQS,
  ensureQueueExists,
  getQueueAttributes
};
