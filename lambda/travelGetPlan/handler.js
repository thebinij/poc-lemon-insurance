const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const snsClient = new SNSClient({
    region: process.env.AWS_REGION || 'ap-southeast-1',
    ...(process.env.AWS_ENDPOINT_URL && { endpoint: process.env.AWS_ENDPOINT_URL })
});

exports.handler = async (event) => {
    console.log("Travel Get Plan Lambda triggered!");
    console.log("Received event:", JSON.stringify(event, null, 2));

    // Example: iterate over SQS messages
    if (event.Records) {
        for (const record of event.Records) {
            console.log("Processing message:", record.body);
            // Add your travel plan retrieval logic here
            try {
                // Parse the SNS notification
                const snsNotification = JSON.parse(record.body);
                console.log("SNS Notification received:", snsNotification);
                
                // Extract the actual message from SNS notification
                const message = JSON.parse(snsNotification.Message);
                console.log("Travel plan request for:", message);
                
                // TODO: Implement travel plan retrieval logic
                // - Query travel plans from database
                // - Apply filters and criteria
                // - Return available plans
                
                // Simulate successful processing
                const responseMessage = {
                    status: "success",
                    service: "travelGetPlan",
                    policyId: message.policyId || "123",
                    timestamp: new Date().toISOString(),
                    data: {
                        message: "Travel plan retrieval completed",
                        plans: ["Basic Plan", "Premium Plan", "Deluxe Plan"]
                    }
                };

                // Publish success response to Travel Event Response SNS
                const publishCommand = new PublishCommand({
                    TopicArn: process.env.TRAVEL_EVENT_RESPONSE_TOPIC_ARN,
                    Message: JSON.stringify(responseMessage),
                    MessageAttributes: {
                        status: {
                            DataType: 'String',
                            StringValue: 'success'
                        },
                        service: {
                            DataType: 'String',
                            StringValue: 'travelGetPlan'
                        },
                        lead: {
                            DataType: 'String',
                            StringValue: 'true'
                        }
                    }
                });
                await snsClient.send(publishCommand);

                console.log("Success response published to Travel Event Response SNS");
                
            } catch (error) {
                console.error("Error processing travel plan request:", error);
                
                // Publish failure response to Travel Event Response SNS
                const errorMessage = {
                    status: "failure",
                    service: "travelGetPlan",
                    policyId: "unknown",
                    timestamp: new Date().toISOString(),
                    error: {
                        message: error.message,
                        code: "TRAVEL_GET_PLAN_ERROR"
                    }
                };

                try {
                    const errorPublishCommand = new PublishCommand({
                        TopicArn: process.env.TRAVEL_EVENT_RESPONSE_TOPIC_ARN,
                        Message: JSON.stringify(errorMessage),
                        MessageAttributes: {
                            status: {
                                DataType: 'String',
                                StringValue: 'failure'
                            },
                            service: {
                                DataType: 'String',
                                StringValue: 'travelGetPlan'
                            },
                            lead: {
                                DataType: 'String',
                                StringValue: 'true'
                            }
                        }
                    });
                    await snsClient.send(errorPublishCommand);
                    console.log("Error response published to Travel Event Response SNS");
                } catch (snsError) {
                    console.error("Failed to publish error response to SNS:", snsError);
                }
            }
        }
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ message: "Travel plan retrieval completed" }),
    };
};
