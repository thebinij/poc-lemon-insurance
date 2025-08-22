# Lambda Function Rules

## Overview
This Lambda function processes SQS messages from the Main BaaS Server. It works with both LocalStack (local development) and AWS (production) using a single unified handler.

## Architecture
- **Unified Handler** (`src/handler.js`): Single handler that automatically detects environment
  - **AWS Mode**: Processes SQS events triggered by AWS Lambda
  - **Local Mode**: Continuously polls LocalStack SQS for development
- **Parse Client** (`src/parseClient.js`): Parse Server integration (currently unused)

## Key Principles
1. **Single Handler**: One file handles both local and AWS environments
2. **Auto-Detection**: Automatically detects if running in AWS Lambda or locally
3. **Simple Processing**: Currently just logs messages without complex business logic
4. **Environment Agnostic**: Same code works in both environments
5. **No Testing**: Jest testing framework removed for simplicity

## File Structure
```
src/
├── handler.js          # Unified handler for both LocalStack and AWS
└── parseClient.js      # Parse Server client (unused)
```

## How It Works
1. **Environment Detection**: Checks if `event.Records` exists to determine AWS vs Local
2. **AWS Mode**: Processes SQS events and returns batch item failures
3. **Local Mode**: Continuously polls LocalStack SQS and processes messages
4. **Shared Logic**: `processMessage()` function handles message processing for both modes

## Development Workflow
1. **Local Development**: `npm run listen:sqs` - runs handler in local mode
2. **AWS Deployment**: Deploy handler.js directly to AWS Lambda
3. **Message Processing**: Simple logging of SQS messages

## Environment Variables
- `AWS_ENDPOINT`: LocalStack endpoint (default: http://localhost:4566)
- `AWS_REGION`: AWS region (default: us-east-1)
- `SQS_QUEUE_URL`: SQS queue URL for local development
- Parse Server variables (currently unused)

## Dependencies
- `@aws-sdk/client-sqs`: SQS client for LocalStack/AWS
- `dotenv`: Environment variable management
- `parse`: Parse Server client (unused)
- Other AWS SDK packages for future use

## Notes
- Parse Client is kept but not used in current implementation
- Focus on simple message processing and logging
- Easy to extend with business logic when needed
- Single handler makes maintenance and deployment simpler
