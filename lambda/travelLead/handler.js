exports.handler = async (event) => {
    console.log("Travel Lead Lambda triggered!");
    console.log("Received event:", JSON.stringify(event, null, 2));

    // Example: iterate over SQS messages
    if (event.Records) {
        for (const record of event.Records) {
            console.log("Processing message:", record.body);
            // Add your travel lead processing logic here
            try {
                const message = JSON.parse(record.body);
                console.log("Travel lead request for:", message);
                
                // TODO: Implement travel lead processing logic
                // - Process lead generation
                // - Qualify leads
                // - Store lead information
                // - Send lead notifications
                // - Track lead conversion
                
            } catch (error) {
                console.error("Error processing travel lead request:", error);
            }
        }
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ message: "Travel lead processing completed" }),
    };
};
