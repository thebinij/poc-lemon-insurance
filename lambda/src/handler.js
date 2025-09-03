const Parse = require('parse/node');
const parseClient = require('./parseHelper.js');

// Initialize Parse for Lambda
Parse.initialize(
  process.env.PARSE_APP_ID || 'lemon-insurance-app-id',
  process.env.PARSE_JS_KEY || 'lemon-insurance-js-key',
  process.env.PARSE_MASTER_KEY || 'lemon-insurance-master-key'
);

Parse.serverURL = process.env.PARSE_SERVER_URL || 'http://140.238.225.133:30553/parse';

// Set Lambda service identification headers for HTTP requests
Parse.Cloud.useMasterKey = true;
Parse.Cloud.httpRequest = function(options) {
  options.headers = options.headers || {};
  options.headers['x-service-type'] = 'lambda';
  options.headers['user-agent'] = 'aws-lambda-insurance-service';
  return Parse.Cloud.httpRequest(options);
};

/**
 * AWS Lambda handler for processing SQS messages
 * Uses parseClient for direct Parse operations
 */
exports.handler = async (event, context) => {
  try {
    console.log('Lambda function triggered by SQS event');
    console.log(`Event has ${event.Records.length} record(s)`);
    console.log('Lambda Context:', {
      functionName: context.functionName,
      awsRequestId: context.awsRequestId,
      memoryLimitInMB: context.memoryLimitInMB
    });

    let processedCount = 0;

    for (const record of event.Records) {
      const body = JSON.parse(record.body);
      const { requestId, insuranceType, userInfo } = body;

      // Verify session token
      if (!userInfo?.sessionToken) {
        console.warn(`Skipping requestId ${requestId}: missing sessionToken`);
        continue;
      }

      console.log(`Processing requestId: ${requestId}, insuranceType: ${insuranceType}`);

      // Construct your response
      const response = {
        success: true,
        message: `Available ${insuranceType} plans retrieved`,
        data: {
          requestId,
          sessionToken: userInfo.sessionToken,
          userId: userInfo.userId,
          plans: [
            { id: 'plan1', name: `Basic ${insuranceType} Plan`, premium: 100 },
            { id: 'plan2', name: `Premium ${insuranceType} Plan`, premium: 200 }
          ]
        }
      };

      // Update API log using parseClient
      try {
        const result = await parseClient.updateAPILog(requestId, insuranceType, {
          status: 'success',
          response,
          responseTime: 150
        });
        
        console.log(`API log updated: ${requestId} (${insuranceType}) - ${result.message}`);
      } catch (error) {
        console.error(`Failed to update API log for ${requestId}:`, error);
        // Continue processing other records even if logging fails
      }

      processedCount++;
    }
    
    console.log(`Total processed records: ${processedCount}`);

    return {
      statusCode: 200,
      body: {
        message: 'SQS batch processing completed',
        processedCount
      }
    };

  } catch (error) {
    console.error('Fatal error in Lambda handler:', error);
    throw error;
  }
};

