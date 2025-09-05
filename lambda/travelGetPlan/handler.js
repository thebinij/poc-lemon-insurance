exports.handler = async (event) => {
    console.log("Travel Get Plan Lambda triggered!");
    console.log("Received event:", JSON.stringify(event, null, 2));

    // Example: iterate over SQS messages
    if (event.Records) {
        for (const record of event.Records) {
            console.log("Processing message:", record.body);
            // Add your travel plan retrieval logic here
            try {
                const message = JSON.parse(record.body);
                console.log("Travel plan request for:", message);
                
                // TODO: Implement travel plan retrieval logic
                // - Query travel plans from database
                // - Apply filters and criteria
                // - Return available plans
                
            } catch (error) {
                console.error("Error processing travel plan request:", error);
            }
        }
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ message: "Travel plan retrieval completed" }),
    };
};
