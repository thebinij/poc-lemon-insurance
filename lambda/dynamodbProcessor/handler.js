const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({
    region: process.env.AWS_REGION || 'ap-southeast-1',
    ...(process.env.AWS_ENDPOINT_URL && { endpoint: process.env.AWS_ENDPOINT_URL })
});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;
const TTL_MINUTES = parseInt(process.env.TTL_MINUTES) || 1;

exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    
    try {
        // Process each SNS record
        for (const record of event.Records) {
            if (record.Sns) {
                const message = JSON.parse(record.Sns.Message);
                const messageAttributes = record.Sns.MessageAttributes || {};
                
                // Extract requestId from message or generate one
                const requestId = message.requestId || message.policyId || message.id || 
                                `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
                
                // Calculate TTL (current time + TTL_MINUTES in seconds)
                const ttl = Math.floor(Date.now() / 1000) + (TTL_MINUTES * 60);
                
                // Prepare DynamoDB item
                const item = {
                    requestId: requestId,
                    eventType: message.eventType || 'unknown',
                    status: message.status || 'unknown',
                    timestamp: new Date().toISOString(),
                    ttl: ttl,
                    message: message,
                    messageAttributes: messageAttributes,
                    snsMessageId: record.Sns.MessageId,
                    snsSubject: record.Sns.Subject || 'No Subject'
                };
                
                // Add any additional fields from the message
                if (message.policyId) item.policyId = message.policyId;
                if (message.userId) item.userId = message.userId;
                if (message.lead) item.lead = message.lead;
                if (message.notification) item.notification = message.notification;
                if (message.cancellation) item.cancellation = message.cancellation;
                
                // Write to DynamoDB
                const putCommand = new PutCommand({
                    TableName: TABLE_NAME,
                    Item: item
                });
                
                await docClient.send(putCommand);
                console.log(`Successfully stored response for requestId: ${requestId}`);
            }
        }
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Successfully processed SNS messages',
                processedCount: event.Records.length
            })
        };
        
    } catch (error) {
        console.error('Error processing SNS messages:', error);
        throw error;
    }
};
