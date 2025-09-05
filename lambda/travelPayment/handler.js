const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const snsClient = new SNSClient({
    region: process.env.AWS_REGION || 'ap-southeast-1',
    ...(process.env.AWS_ENDPOINT_URL && { endpoint: process.env.AWS_ENDPOINT_URL })
});

exports.handler = async (event) => {
    console.log("Travel Payment Lambda triggered!");
    console.log("Received event:", JSON.stringify(event, null, 2));

    // Example: iterate over SQS messages
    if (event.Records) {
        for (const record of event.Records) {
            console.log("Processing message:", record.body);
            // Add your travel payment logic here
            try {
                // Parse the SNS notification
                const snsNotification = JSON.parse(record.body);
                console.log("SNS Notification received:", snsNotification);
                
                // Extract the actual message from SNS notification
                const message = JSON.parse(snsNotification.Message);
                console.log("Travel payment request for:", message);
                
                // TODO: Implement travel payment logic
                // - Process payment transactions
                // - Validate payment methods
                // - Handle payment failures
                // - Update payment status
                // - Send payment confirmations
                
                // Simulate successful processing
                const responseMessage = {
                    status: "success",
                    service: "travelPayment",
                    policyId: message.policyId || "789",
                    timestamp: new Date().toISOString(),
                    data: {
                        message: "Travel payment processing completed",
                        paymentStatus: "completed",
                        transactionId: "TXN-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
                        amount: message.amount || "99.99"
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
                            StringValue: 'travelPayment'
                        }
                    }
                });
                await snsClient.send(publishCommand);

                console.log("Success response published to Travel Event Response SNS");
                
            } catch (error) {
                console.error("Error processing travel payment request:", error);
                
                // Publish failure response to Travel Event Response SNS
                const errorMessage = {
                    status: "failure",
                    service: "travelPayment",
                    policyId: "unknown",
                    timestamp: new Date().toISOString(),
                    error: {
                        message: error.message,
                        code: "TRAVEL_PAYMENT_ERROR"
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
                                StringValue: 'travelPayment'
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
        body: JSON.stringify({ message: "Travel payment processing completed" }),
    };
};
