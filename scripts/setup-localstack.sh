#!/bin/bash

echo "🚀 Setting up LocalStack for local development..."

# Wait for LocalStack to be ready
echo "⏳ Waiting for LocalStack to be ready..."
until curl -s http://localhost:4566/_localstack/health > /dev/null; do
    echo "   Waiting for LocalStack..."
    sleep 2
done
echo "✅ LocalStack is ready!"

# Set AWS environment variables for LocalStack
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
export AWS_ENDPOINT_URL=http://localhost:4566

# Clean up existing resources
echo "🧹 Cleaning up existing LocalStack resources..."

# Delete existing event source mappings
echo "   Deleting existing event source mappings..."
aws --endpoint-url=http://localhost:4566 lambda list-event-source-mappings \
    --function-name insurance-event-processor 2>/dev/null | \
    jq -r '.EventSourceMappings[].UUID' 2>/dev/null | \
    while read uuid; do
        if [ ! -z "$uuid" ]; then
            echo "     Deleting event source mapping: $uuid"
            aws --endpoint-url=http://localhost:4566 lambda delete-event-source-mapping --uuid "$uuid" 2>/dev/null
        fi
    done

# Delete existing Lambda function
echo "   Deleting existing Lambda function..."
aws --endpoint-url=http://localhost:4566 lambda delete-function \
    --function-name insurance-event-processor 2>/dev/null || echo "     No existing Lambda function found"

# Delete existing SQS queue
echo "   Deleting existing SQS queue..."
aws --endpoint-url=http://localhost:4566 sqs delete-queue \
    --queue-url "http://localhost:4566/000000000000/insurance-events" 2>/dev/null || echo "     No existing SQS queue found"

# Wait a moment for cleanup to complete
sleep 2

echo "✅ Cleanup complete!"

# Create SQS queue for insurance events
echo "📤 Creating SQS queue for insurance events..."
aws --endpoint-url=http://localhost:4566 sqs create-queue \
    --queue-name insurance-events \
    --attributes '{
        "VisibilityTimeout": "30",
        "MessageRetentionPeriod": "1209600",
        "MaximumMessageSize": "262144"
    }'

# Get queue URL
QUEUE_URL=$(aws --endpoint-url=http://localhost:4566 sqs get-queue-url --queue-name insurance-events --query 'QueueUrl' --output text)
echo "✅ SQS queue created: $QUEUE_URL"

# Create Lambda function for insurance processing
echo "🔧 Creating Lambda function for insurance processing..."

# Create deployment package
cd lambda
echo "   Installing dependencies..."
npm install

echo "   Creating deployment package..."
# Create a temporary directory for packaging
mkdir -p /tmp/lambda-package
cp -r src/ /tmp/lambda-package/
cp package.json /tmp/lambda-package/
cp -r node_modules/ /tmp/lambda-package/

# Create zip file from the temporary directory
cd /tmp/lambda-package
zip -r function.zip . > /dev/null
cd -

# Move the zip file to lambda directory
mv /tmp/lambda-package/function.zip .
rm -rf /tmp/lambda-package

echo "   Deployment package created: function.zip"

# Create Lambda function
aws --endpoint-url=http://localhost:4566 lambda create-function \
    --function-name insurance-event-processor \
    --runtime nodejs20.x \
    --role arn:aws:iam::000000000000:role/lambda-role \
    --handler src/handler.handler \
    --zip-file fileb://function.zip \
    --timeout 30 \
    --memory-size 128

echo "✅ Lambda function created!"

# Wait for Lambda function to be ready
echo "⏳ Waiting for Lambda function to be ready..."
sleep 5

# Create event source mapping (SQS to Lambda)
echo "🔗 Creating event source mapping..."
aws --endpoint-url=http://localhost:4566 lambda create-event-source-mapping \
    --function-name insurance-event-processor \
    --event-source-arn arn:aws:sqs:us-east-1:000000000000:insurance-events \
    --batch-size 10

echo "✅ Event source mapping created!"

# Clean up
rm function.zip
cd ..

echo "🎉 LocalStack setup complete!"
echo ""
echo "📋 Summary:"
echo "   SQS Queue: $QUEUE_URL"
echo "   Lambda Function: insurance-event-processor"
echo "   Event Source: SQS → Lambda"
echo ""
echo "🚀 You can now:"
echo "   1. Start Main Baas Server: npm run dev:main-baas"
echo "   2. Start Lambda SQS Listener: npm run dev:lambda"
echo "   3. Or run both together: npm run dev"
echo "   4. Test endpoints that trigger SQS events"
echo "   5. Lambda will automatically process SQS messages"
echo ""
echo "📝 Note: For local development, you can also use the Lambda SQS listener"
echo "   instead of the LocalStack Lambda function by running: npm run dev:lambda"
