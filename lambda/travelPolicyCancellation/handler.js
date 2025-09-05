exports.handler = async (event) => {
    console.log("Travel Policy Cancellation Lambda triggered!");
    console.log("Received event:", JSON.stringify(event, null, 2));

    // Example: iterate over SQS messages
    if (event.Records) {
        for (const record of event.Records) {
            console.log("Processing message:", record.body);
            // Add your travel policy cancellation logic here
            try {
                const message = JSON.parse(record.body);
                console.log("Travel policy cancellation request for:", message);
                
                // TODO: Implement travel policy cancellation logic
                // - Process cancellation requests
                // - Calculate refund amounts
                // - Update policy status
                // - Send cancellation confirmations
                // - Handle cancellation fees
                
            } catch (error) {
                console.error("Error processing travel policy cancellation request:", error);
            }
        }
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ message: "Travel policy cancellation completed" }),
    };
};
