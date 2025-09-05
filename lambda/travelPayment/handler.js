exports.handler = async (event) => {
    console.log("Travel Payment Lambda triggered!");
    console.log("Received event:", JSON.stringify(event, null, 2));

    // Example: iterate over SQS messages
    if (event.Records) {
        for (const record of event.Records) {
            console.log("Processing message:", record.body);
            // Add your travel payment logic here
            try {
                const message = JSON.parse(record.body);
                console.log("Travel payment request for:", message);
                
                // TODO: Implement travel payment logic
                // - Process payment transactions
                // - Validate payment methods
                // - Handle payment failures
                // - Update payment status
                // - Send payment confirmations
                
            } catch (error) {
                console.error("Error processing travel payment request:", error);
            }
        }
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ message: "Travel payment processing completed" }),
    };
};
