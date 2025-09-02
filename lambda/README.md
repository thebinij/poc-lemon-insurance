# Insurance Lambda Handler

This Lambda function processes SQS messages from the insurance service. It's designed to be production-ready and deployable to both AWS and LocalStack environments with the exact same code.

## Architecture

- **Single Codebase**: Same handler code runs in both AWS Lambda and LocalStack
- **Event-Driven**: Automatically triggered by SQS events (no polling logic)
- **Production-Ready**: Handles batch processing, error handling, and retries
- **Business Logic**: Processes different types of insurance events

## Features

- **SQS Integration**: Automatically triggered by SQS events
- **Batch Processing**: Handles multiple messages in a single invocation
- **Error Handling**: Returns batch item failures for failed messages
- **Event Types**: Supports multiple insurance event types:
  - `INSURANCE_QUOTE_REQUESTED`
  - `INSURANCE_PURCHASE_COMPLETED`
  - `INSURANCE_CLAIM_SUBMITTED`

## Usage

### AWS Lambda (Production)
1. Build the deployment package: `npm run build`
2. Upload `../function-prod.zip` to AWS Lambda
3. Configure SQS event source mapping to trigger the function

### LocalStack
1. Deploy to LocalStack: `npm run deploy:localstack`
2. Configure SQS event source mapping in LocalStack
3. Send messages to the SQS queue to trigger the function

### Local Testing
Test the handler with mock events: `npm test`

## Environment Variables

The handler automatically detects the environment and works with:
- **AWS**: Uses default AWS credentials and endpoints
- **LocalStack**: Uses LocalStack endpoints and local credentials

## Scripts

- `npm run build` - Create production deployment package
- `npm test` - Test handler locally with mock SQS events

## LocalStack Setup

Use the provided setup script to deploy to LocalStack:

```bash
# From the project root
./scripts/setup-localstack.sh
```

This script will:
1. Start LocalStack and wait for it to be ready
2. Create the SQS queue
3. Deploy the Lambda function
4. Configure the event source mapping
5. Clean up temporary files

Alternatively, you can run the steps manually:
1. Start LocalStack: `docker-compose up -d`
2. Run setup script: `./scripts/setup-localstack.sh`

## Message Format

The handler expects SQS messages with this structure:

```json
{
  "eventType": "INSURANCE_QUOTE_REQUESTED",
  "insuranceType": "AUTO",
  "requestId": "req-123",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "status": "pending"
}
```

## Response Format

Successful processing returns:
```json
{
  "statusCode": 200,
  "body": {
    "message": "All messages processed successfully",
    "processedCount": 1,
    "results": [...]
  }
}
```

Failed messages return batch item failures for SQS retry:
```json
{
  "batchItemFailures": [
    { "itemIdentifier": "message-id" }
  ],
  "results": [...]
}
```
