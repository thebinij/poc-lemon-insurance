# Lambda Monorepo Structure

This directory contains all Lambda functions for the insurance service in a monorepo pattern.

## Structure

```
lambda/
├── package.json                 # Single package.json with all dependencies
├── scripts/                     # Build scripts for different Lambda types
│   ├── build-all-lambdas.sh    # Build all Lambda functions
│   ├── build-dynamodb-lambda.sh # Build only DynamoDB processor
│   └── build-travel-lambdas.sh  # Build only Travel Lambda functions
├── travelGetPlan/              # Travel Get Plan Lambda
├── travelPolicyService/        # Travel Policy Service Lambda
├── travelPayment/              # Travel Payment Lambda
├── travelNotificationService/  # Travel Notification Service Lambda
├── travelPolicyCancellation/   # Travel Policy Cancellation Lambda
├── travelLead/                 # Travel Lead Lambda
└── dynamodbProcessor/          # DynamoDB Processor Lambda
```

## Dependencies

The monorepo uses a single `package.json` with all dependencies:

### All Dependencies
- `@aws-sdk/client-sns` - For SNS operations
- `@aws-sdk/client-dynamodb` - For DynamoDB operations
- `@aws-sdk/lib-dynamodb` - For DynamoDB document operations
- `uuid` - For UUID generation
- `parse` - For Parse Server integration
- `mongodb` - For MongoDB operations

### Selective Installation

Each Lambda function gets only the dependencies it needs:

- **Travel Lambda functions**: `@aws-sdk/client-sns`, `uuid`, `parse`, `mongodb`
- **DynamoDB Processor**: `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`

## Build Scripts

### Build All Lambdas
```bash
npm run build:all
# or
./scripts/build-all-lambdas.sh
```

### Build DynamoDB Lambda Only
```bash
npm run build:dynamodb
# or
./scripts/build-dynamodb-lambda.sh
```

### Build Travel Lambdas Only
```bash
npm run build:travel
# or
./scripts/build-travel-lambdas.sh
```

## Benefits

1. **Single Source of Truth**: One `package.json` for all dependencies
2. **Selective Dependencies**: Each Lambda gets only what it needs
3. **Easier Maintenance**: Update dependencies in one place
4. **Consistent Versions**: All functions use the same dependency versions
5. **Faster Builds**: Dependencies are installed once and reused

## Usage

1. Install all dependencies: `npm install`
2. Build all Lambda functions: `npm run build:all`
3. Deploy with Terraform: `terraform apply`

## Adding New Lambda Functions

1. Create the function directory: `mkdir newFunction`
2. Add the handler: `newFunction/handler.js`
3. Add to `package.json` workspaces array
4. Add to build scripts as needed
5. Update Terraform configuration
