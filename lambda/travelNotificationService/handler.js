exports.handler = async (event) => {
    console.log("Travel Notification Service Lambda triggered!");
    console.log("Received event:", JSON.stringify(event, null, 2));

    // Example: iterate over SQS messages
    if (event.Records) {
        for (const record of event.Records) {
            console.log("Processing message:", record.body);
            // Add your travel notification logic here
            try {
                const message = JSON.parse(record.body);
                console.log("Travel notification request for:", message);
                
                // TODO: Implement travel notification logic
                // - Send email notifications
                // - Send SMS notifications
                // - Send push notifications
                // - Handle notification preferences
                // - Track notification delivery
                
            } catch (error) {
                console.error("Error processing travel notification request:", error);
            }
        }
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ message: "Travel notification service completed" }),
    };
};
