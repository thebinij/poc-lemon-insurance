const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } = require('@aws-sdk/client-sqs');

/**
 * Lambda handler that works with both LocalStack and AWS
 * Automatically detects environment and processes messages accordingly
 * @param {Object} event - SQS event (AWS) or undefined (local)
 * @param {Object} context - Lambda context (AWS) or undefined (local)
 * @returns {Object} - Response object
 */
exports.handler = async (event, context) => {
  try {
    // Check if running in AWS Lambda or locally
    const isAWSLambda = event && event.Records && Array.isArray(event.Records);
    
    if (isAWSLambda) {
      return await handleAWSLambda(event, context);
    } else {
      return await handleLocalStack();
    }
  } catch (error) {
    console.error('💥 Fatal error in handler:', error);
    
    // Return proper error response for LocalStack
    return {
      statusCode: 500,
      body: {
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      }
    };
  }
};

/**
 * Handle AWS Lambda SQS events
 * @param {Object} event - SQS event
 * @param {Object} context - Lambda context
 * @returns {Object} - Response with batch item failures
 */
async function handleAWSLambda(event, context) {
  console.log('🚀 AWS Lambda function triggered');
  console.log('📥 Event:', JSON.stringify(event, null, 2));
  console.log('🔧 Context:', JSON.stringify(context, null, 2));

  const results = [];
  const batchItemFailures = [];

  try {
    // Process each message in the batch
    for (const record of event.Records) {
      try {
        const result = await processMessage(record.body, record);
        results.push(result);
        
      } catch (error) {
        console.error(`❌ Error processing message ${record.messageId}:`, error);
        
        // Add to batch failures for SQS to retry
        batchItemFailures.push({
          itemIdentifier: record.messageId
        });
        
        results.push({
          messageId: record.messageId,
          status: 'failed',
          error: error.message
        });
      }
    }

    // Return batch item failures if any messages failed
    if (batchItemFailures.length > 0) {
      console.log(`⚠️ ${batchItemFailures.length} messages failed processing`);
      return {
        batchItemFailures,
        results
      };
    }

    console.log('🎉 All messages processed successfully');
    return {
      statusCode: 200,
      body: {
        message: 'All messages processed successfully',
        processedCount: results.length,
        results
      }
    };

  } catch (error) {
    console.error('💥 AWS Lambda function error:', error);
    throw error;
  }
}

/**
 * Handle LocalStack SQS messages (continuous polling)
 * @returns {Promise<Object>} - Response object
 */
async function handleLocalStack() {
  console.log('🏠 Starting Local Lambda Handler');
  console.log('📡 Connecting to LocalStack SQS...');
  
  // Initialize LocalStack SQS client
  const sqsClient = new SQSClient({
    endpoint: process.env.AWS_ENDPOINT || 'http://localhost:4566',
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'local',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'local'
    }
  });

  const QUEUE_URL = process.env.SQS_QUEUE_URL || 'http://localhost:4566/000000000000/insurance-events';
  console.log('📡 Queue URL:', QUEUE_URL);
  console.log('⏱️  Polling for messages every 5 seconds...');
  console.log('🛑 Press Ctrl+C to stop\n');

  let isRunning = true;
  let processedCount = 0;

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down local handler...');
    isRunning = false;
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down local handler...');
    isRunning = false;
    process.exit(0);
  });

  try {
    while (isRunning) {
      try {
        // Receive messages from SQS
        const receiveCommand = new ReceiveMessageCommand({
          QueueUrl: QUEUE_URL,
          MaxNumberOfMessages: 10,
          WaitTimeSeconds: 5,
          MessageAttributeNames: ['All']
        });

        const response = await sqsClient.send(receiveCommand);
        
        if (response.Messages && response.Messages.length > 0) {
          console.log(`📥 Received ${response.Messages.length} message(s) from LocalStack SQS`);
          
          // Process messages
          for (const message of response.Messages) {
            try {
              const result = await processMessage(message.Body, message);
              console.log(`✅ Processed message: ${message.MessageId}`);
              processedCount++;
              
              // Delete successfully processed message
              const deleteCommand = new DeleteMessageCommand({
                QueueUrl: QUEUE_URL,
                ReceiptHandle: message.ReceiptHandle
              });
              
              await sqsClient.send(deleteCommand);
              console.log(`🗑️  Deleted message: ${message.MessageId}`);
              
            } catch (error) {
              console.error(`❌ Failed to process message ${message.MessageId}:`, error);
              // Don't delete failed messages - let them be retried
            }
          }
          
        } else {
          console.log('⏳ No messages in queue, waiting...');
        }
        
      } catch (error) {
        console.error('❌ Error in local handler:', error);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  } catch (error) {
    console.error('💥 Fatal error in local handler:', error);
    throw error;
  }

  // Return success response for LocalStack
  return {
    statusCode: 200,
    body: {
      message: 'Local handler completed successfully',
      processedCount: processedCount,
      mode: 'local'
    }
  };
}

/**
 * Process individual message (shared logic)
 * @param {string|Object} messageBody - Message body
 * @param {Object} record - Message record
 * @returns {Object} - Processing result
 */
async function processMessage(messageBody, record) {
  const messageId = record.messageId || record.MessageId || 'unknown';
  
  console.log(`📝 Processing message: ${messageId}`);
  
  // Parse the message body (handle both string and object)
  let parsedBody = messageBody;
  if (typeof messageBody === 'string') {
    try {
      parsedBody = JSON.parse(messageBody);
    } catch (error) {
      console.error(`❌ Failed to parse message body:`, error);
      throw new Error(`Invalid message format: ${error.message}`);
    }
  }
  
  console.log('📋 Message body:', JSON.stringify(parsedBody, null, 2));

  // Simple processing - just log the message
  console.log(`✅ Message ${messageId} processed successfully`);
  console.log(`📊 Message details:`, {
    messageId: messageId,
    eventType: parsedBody.eventType,
    insuranceType: parsedBody.insuranceType,
    requestId: parsedBody.requestId,
    timestamp: parsedBody.timestamp,
    status: parsedBody.status
  });
  
  return {
    messageId: messageId,
    status: 'processed',
    processedAt: new Date().toISOString(),
    eventType: parsedBody.eventType,
    insuranceType: parsedBody.insuranceType,
    requestId: parsedBody.requestId
  };
}

// Start local handler if this file is run directly
if (require.main === module) {
  exports.handler().catch(error => {
    console.error('💥 Fatal error in handler:', error);
    process.exit(1);
  });
}
