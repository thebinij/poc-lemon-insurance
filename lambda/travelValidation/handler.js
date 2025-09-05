
exports.handler = async (event) => {
    console.log("Travel Validation Lambda triggered!");
    console.log("Received event:", JSON.stringify(event, null, 2));

    // Example: iterate over SQS messages
    if (event.Records) {
        for (const record of event.Records) {
            console.log("Processing message:", record.body);
            // Add your validation logic here
        }
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ message: "Travel validation completed" }),
    };
};
