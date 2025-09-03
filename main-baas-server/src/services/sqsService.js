import { SQSClient, SendMessageCommand, CreateQueueCommand, GetQueueAttributesCommand } from '@aws-sdk/client-sqs';
import config from '../config/environment.js';

// Initialize SQS client with centralized config
const sqsClient = new SQSClient(config.getAwsConfig());

/**
 * Publish a message to SQS
 * @param {Object} message - The message to publish
 * @returns {Promise<Object>} - SQS send result
 */
async function publishToSQS(message) {
  try {
    const params = {
      QueueUrl: config.getSqsQueueUrl(),
      MessageBody: JSON.stringify(message),
      MessageAttributes: {
        'EventType': { 
          DataType: 'String', StringValue: message.eventType
        },
        'InsuranceType': {
          DataType: 'String', StringValue: message.insuranceType
        },
        'RequestId': {
           DataType: 'String', StringValue: message.requestId
        },
        'Timestamp': {
          DataType: 'String', StringValue: message.timestamp
        }
      }
    };

    console.log(`Publishing to SQS: ${message.eventType} for ${message.insuranceType} insurance`);
    
    const command = new SendMessageCommand(params);
    const result = await sqsClient.send(command);
    
    console.log(`Message sent to SQS successfully. MessageId: ${result.MessageId}`);
    
    return result;
  } catch (error) {
    console.error('Error publishing to SQS:', error);
    throw error;
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
    console.error('Error getting queue attributes:', error);
    throw error;
  }
}

export {
  publishToSQS,
  getQueueAttributes
};
