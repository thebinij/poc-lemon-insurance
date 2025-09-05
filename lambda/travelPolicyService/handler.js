exports.handler = async (event) => {
    console.log("Travel Policy Service Lambda triggered!");
    console.log("Received event:", JSON.stringify(event, null, 2));

    // Example: iterate over SQS messages
    if (event.Records) {
        for (const record of event.Records) {
            console.log("Processing message:", record.body);
            // Add your travel policy service logic here
            try {
                const message = JSON.parse(record.body);
                console.log("Travel policy service request for:", message);
                
                // TODO: Implement travel policy service logic
                // - Create/update travel policies
                // - Validate policy data
                // - Store policy information
                // - Send notifications
                
            } catch (error) {
                console.error("Error processing travel policy service request:", error);
            }
        }
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ message: "Travel policy service completed" }),
    };
};
