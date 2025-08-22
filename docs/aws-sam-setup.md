# AWS SAM CLI Setup Guide for Insurance Lambda

## 🎯 **Overview**

This guide sets up AWS SAM CLI for local development of the insurance Lambda function with SQS integration. SAM CLI provides the most accurate AWS Lambda simulation locally, ensuring your code works identically in production.

## 🚀 **Prerequisites**

- **Node.js 20+** and **npm**
- **Docker Desktop** (for Lambda container simulation)
- **AWS CLI** (for SAM operations)
- **LocalStack** (for SQS simulation)

## 📦 **Installation**

### 1. Install AWS SAM CLI

**macOS (Homebrew):**
```bash
brew install aws-sam-cli
```

**macOS/Linux (Direct):**
```bash
pip install aws-sam-cli
```

**Windows:**
```bash
# Download from AWS website or use Chocolatey
choco install aws-sam-cli
```

### 2. Verify Installation
```bash
sam --version
# Should show: SAM CLI, version 1.x.x
```

## 🔧 **Project Structure**

```
lambda/
├── src/
│   ├── handler.js          # Lambda function code
│   ├── parseClient.js      # Parse Server client
│   └── localHandler.js     # Local SQS listener (alternative)
├── template.yaml           # SAM template
├── package.json            # Dependencies
└── .env                    # Environment variables
```

## 📋 **SAM Template Configuration**

### Create `lambda/template.yaml`:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: Insurance Lambda function with SQS trigger (LOCAL DEVELOPMENT)

Globals:
  Function:
    Timeout: 30
    MemorySize: 128
    Runtime: nodejs20.x
    Environment:
      Variables:
        NODE_ENV: development
        PARSE_APP_ID: lemon-insurance-app-id
        PARSE_JS_KEY: lemon-insurance-js-key
        PARSE_MASTER_KEY: lemon-insurance-master-key
        PARSE_SERVER_URL: http://localhost:1337/parse

Resources:
  InsuranceEventsQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: insurance-events-local
      VisibilityTimeoutSeconds: 30
      MessageRetentionPeriod: 1209600
      MaximumMessageSize: 262144
      RedrivePolicy:
        deadLetterTargetArn: !GetAtt InsuranceEventsDLQ.Arn
        maxReceiveCount: 3

  InsuranceEventsDLQ:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: insurance-events-dlq-local
      MessageRetentionPeriod: 1209600

  ProcessInsuranceEventsFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: process-insurance-events-local
      CodeUri: ./
      Handler: src/handler.handler
      Description: Process insurance events from SQS queue
      Events:
        SQSEvent:
          Type: SQS
          Properties:
            Queue: !GetAtt InsuranceEventsQueue.Arn
            BatchSize: 10
            MaximumBatchingWindowInSeconds: 5
      Policies:
        - SQSPollerPolicy:
            QueueName: !GetAtt InsuranceEventsQueue.Arn
        - CloudWatchLogsFullAccessPolicy: {}

Outputs:
  InsuranceEventsQueueUrl:
    Description: URL of the insurance events SQS queue
    Value: !Ref InsuranceEventsQueue
    Export:
      Name: InsuranceEventsQueueUrl-Local

  InsuranceEventsQueueArn:
    Description: ARN of the insurance events SQS queue
    Value: !GetAtt InsuranceEventsQueue.Arn
    Export:
      Name: InsuranceEventsQueueArn-Local

  ProcessInsuranceEventsFunction:
    Description: Insurance Lambda function ARN
    Value: !GetAtt ProcessInsuranceEventsFunction.Arn
    Export:
      Name: ProcessInsuranceEventsFunction-Local
```

## 🛠️ **Setup Steps**

### 1. Install Lambda Dependencies
```bash
cd lambda
npm install
```

### 2. Build SAM Application
```bash
# Build the Lambda function
sam build

# Build with watch mode (auto-rebuild on changes)
sam build --watch
```

### 3. Start Local Development
```bash
# Start SAM local with SQS events
sam local start-lambda --env-vars .env

# Or start with API Gateway (if needed)
sam local start-api --env-vars .env
```

## 🧪 **Testing with SAM CLI**

### 1. Test Lambda Function Locally
```bash
# Test with sample SQS event
sam local invoke ProcessInsuranceEventsFunction \
  --event events/sqs-event.json \
  --env-vars .env
```

### 2. Create Sample SQS Event (`events/sqs-event.json`):
```json
{
  "Records": [
    {
      "messageId": "test-message-1",
      "receiptHandle": "test-receipt-handle",
      "body": "{\"eventType\":\"GET_AVAILABLE_PLANS\",\"insuranceType\":\"travel\",\"requestId\":\"test-request-1\",\"eventId\":\"test-event-1\",\"data\":{\"insuredDetail\":{\"fullName\":\"Test User\",\"extension\":\"+1\",\"mobileNumber\":\"1234567890\",\"email\":\"test@example.com\"},\"travelDetail\":{\"tripType\":\"one-way\",\"departureCountry\":\"US\",\"destinationCountry\":\"CA\",\"departureDate\":\"2025-12-31\",\"adultCount\":\"1\",\"childCount\":\"0\",\"infantCount\":\"0\"}},\"timestamp\":\"2025-08-22T09:00:00.000Z\",\"status\":\"pending\"}",
      "attributes": {},
      "messageAttributes": {
        "EventType": {
          "DataType": "String",
          "StringValue": "GET_AVAILABLE_PLANS"
        },
        "InsuranceType": {
          "DataType": "String",
          "StringValue": "travel"
        }
      },
      "md5OfBody": "test-md5",
      "eventSource": "aws:sqs",
      "eventSourceARN": "arn:aws:sqs:us-east-1:000000000000:insurance-events-local",
      "awsRegion": "us-east-1"
    }
  ]
}
```

### 3. Test with Real SQS Messages
```bash
# Start SAM local Lambda
sam local start-lambda --env-vars .env

# In another terminal, send messages to LocalStack SQS
aws --endpoint-url=http://localhost:4566 sqs send-message \
  --queue-url http://localhost:4566/000000000000/insurance-events-local \
  --message-body '{"eventType":"GET_AVAILABLE_PLANS","insuranceType":"travel","requestId":"test-123","eventId":"event-123","data":{"test":"data"},"timestamp":"2025-08-22T09:00:00.000Z","status":"pending"}'
```

## 🔄 **Development Workflow**

### 1. Start Development Environment
```bash
# Terminal 1: Start Main Baas Server
npm run dev:main-baas

# Terminal 2: Start SAM Local Lambda
cd lambda
sam local start-lambda --env-vars .env

# Terminal 3: Start LocalStack (if not running)
docker-compose up localstack
```

### 2. Test Complete Flow
```bash
# Make API call to Main Baas Server
curl -X POST http://localhost:3000/api/insurance/travel/GetAvailablePlans \
  -H "Content-Type: application/json" \
  -d '{"insuredDetail":{"fullName":"Test User","extension":"+1","mobileNumber":"1234567890","email":"test@example.com"},"travelDetail":{"tripType":"one-way","departureCountry":"US","destinationCountry":"CA","departureDate":"2025-12-31","adultCount":"1","childCount":"0","infantCount":"0"}}'
```

### 3. Watch Lambda Processing
- Main Baas Server creates event in Parse Server
- Sends message to LocalStack SQS
- SAM Local Lambda receives and processes message
- Updates Parse Server with processed status

## 📊 **Environment Variables**

### Create `lambda/.env`:
```bash
# Parse Server Configuration
PARSE_APP_ID=lemon-insurance-app-id
PARSE_JS_KEY=lemon-insurance-js-key
PARSE_MASTER_KEY=lemon-insurance-master-key
PARSE_SERVER_URL=http://localhost:1337/parse

# AWS Configuration (LocalStack)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test

# SQS Configuration
SQS_QUEUE_URL=http://localhost:4566/000000000000/insurance-events-local

# Logging
NODE_ENV=development
LOG_LEVEL=debug
```

## 🚨 **Troubleshooting**

### Common Issues:

1. **Docker not running:**
   ```bash
   # Start Docker Desktop
   # Verify with:
   docker ps
   ```

2. **Port conflicts:**
   ```bash
   # Check what's using port 3001
   lsof -i :3001
   
   # Kill process or change port in template.yaml
   ```

3. **SQS connection issues:**
   ```bash
   # Verify LocalStack is running
   curl http://localhost:4566/_localstack/health
   
   # Check SQS queue exists
   aws --endpoint-url=http://localhost:4566 sqs list-queues
   ```

4. **Parse Server connection:**
   ```bash
   # Verify Parse Server is running
   curl http://localhost:1337/parse/health
   ```

## 📝 **Package.json Scripts**

### Add to `lambda/package.json`:
```json
{
  "scripts": {
    "dev:sam": "sam local start-lambda --env-vars .env",
    "dev:sam:watch": "sam build --watch & sam local start-lambda --env-vars .env",
    "build:sam": "sam build",
    "test:sam": "sam local invoke ProcessInsuranceEventsFunction --event events/sqs-event.json --env-vars .env",
    "validate:sam": "sam validate"
  }
}
```

### Add to root `package.json`:
```json
{
  "scripts": {
    "dev:sam": "concurrently \"npm run dev:main-baas\" \"cd lambda && npm run dev:sam\"",
    "dev:sam:watch": "concurrently \"npm run dev:main-baas\" \"cd lambda && npm run dev:sam:watch\""
  }
}
```

## 🎯 **Benefits of SAM CLI**

1. **AWS Parity**: Exact Lambda runtime simulation
2. **SQS Integration**: Real SQS event processing
3. **Environment Variables**: Same as production
4. **Hot Reloading**: Auto-rebuild on code changes
5. **Local Testing**: Test without AWS deployment
6. **Production Confidence**: Code tested in AWS-like environment

## 🚀 **Next Steps**

1. **Install SAM CLI** following installation guide
2. **Create template.yaml** in lambda directory
3. **Set up environment variables**
4. **Test with sample events**
5. **Integrate with Main Baas Server**
6. **Verify complete flow works locally**

This setup gives you the most accurate AWS Lambda simulation locally while maintaining the flexibility to deploy to any environment when ready!
