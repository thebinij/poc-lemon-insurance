# AWS Deployment Guide for Insurance System

## 🎯 **Overview**

This guide walks you through deploying your insurance Lambda function and SQS infrastructure to AWS using AWS Credentials Manager. This approach is more secure and follows AWS best practices.

## 🚀 **Prerequisites**

- **AWS CLI** installed and configured
- **AWS Credentials Manager** set up with your credentials
- **Node.js 20+** and **npm**
- **Access to AWS Console** (IAM, SQS, Lambda, CloudWatch)

## 🔐 **AWS Credentials Setup**

### 1. Install AWS CLI
```bash
# macOS
brew install awscli

# Windows
# Download from AWS website

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

### 2. Configure AWS Credentials
```bash
aws configure
```

**Enter your details:**
- AWS Access Key ID: `your-access-key`
- AWS Secret Access Key: `your-secret-key`
- Default region: `us-east-1` (or your preferred region)
- Default output format: `json`

### 3. Verify Configuration
```bash
aws sts get-caller-identity
```

**Expected output:**
```json
{
    "UserId": "AIDACKCEVSQ6C2EXAMPLE",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/your-username"
}
```

## 🏗️ **Infrastructure Deployment**

### **Step 1: Create SQS Queue**

```bash
# Create main SQS queue
aws sqs create-queue \
  --queue-name insurance-events-prod \
  --attributes '{
    "VisibilityTimeout": "30",
    "MessageRetentionPeriod": "1209600",
    "MaximumMessageSize": "262144"
  }'

# Create dead letter queue
aws sqs create-queue \
  --queue-name insurance-events-dlq-prod

# Get DLQ ARN
aws sqs get-queue-attributes \
  --queue-url https://sqs.us-east-1.amazonaws.com/123456789012/insurance-events-dlq-prod \
  --attribute-names QueueArn
```

**Note:** Replace `123456789012` with your actual AWS account ID.

### **Step 2: Configure Dead Letter Queue**

```bash
# Get your account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text)

# Get DLQ ARN
DLQ_ARN=$(aws sqs get-queue-attributes \
  --queue-url https://sqs.us-east-1.amazonaws.com/$ACCOUNT_ID/insurance-events-dlq-prod \
  --attribute-names QueueArn \
  --query 'Attributes.QueueArn' \
  --output text)

# Update main queue with DLQ policy
aws sqs set-queue-attributes \
  --queue-url https://sqs.us-east-1.amazonaws.com/$ACCOUNT_ID/insurance-events-prod \
  --attributes '{
    "RedrivePolicy": "{\"deadLetterTargetArn\":\"'$DLQ_ARN'\",\"maxReceiveCount\":\"3\"}"
  }'
```

### **Step 3: Create IAM Role for Lambda**

```bash
# Create trust policy file
cat > trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create IAM role
aws iam create-role \
  --role-name insurance-lambda-role \
  --assume-role-policy-document file://trust-policy.json

# Attach basic execution policy
aws iam attach-role-policy \
  --role-name insurance-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# Attach SQS execution policy
aws iam attach-role-policy \
  --role-name insurance-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaSQSQueueExecutionRole

# Get role ARN
ROLE_ARN=$(aws iam get-role \
  --role-name insurance-lambda-role \
  --query 'Role.Arn' \
  --output text)

echo "Role ARN: $ROLE_ARN"
```

### **Step 4: Deploy Lambda Function**

```bash
# Navigate to lambda directory
cd lambda

# Install production dependencies only
npm ci --only=production

# Create deployment package
zip -r function-prod.zip src/ package.json node_modules/

# Deploy Lambda function
aws lambda create-function \
  --function-name insurance-event-processor-prod \
  --runtime nodejs20.x \
  --role $ROLE_ARN \
  --handler src/handler.handler \
  --zip-file fileb://function-prod.zip \
  --timeout 30 \
  --memory-size 128 \
  --environment Variables='{
    "NODE_ENV": "production",
    "PARSE_APP_ID": "your-parse-app-id",
    "PARSE_JS_KEY": "your-parse-js-key",
    "PARSE_MASTER_KEY": "your-parse-master-key",
    "PARSE_SERVER_URL": "https://your-parse-server.com/parse"
  }'

# Clean up
rm function-prod.zip
cd ..
```

### **Step 5: Create Event Source Mapping**

```bash
# Get SQS queue ARN
SQS_ARN=$(aws sqs get-queue-attributes \
  --queue-url https://sqs.us-east-1.amazonaws.com/$ACCOUNT_ID/insurance-events-prod \
  --attribute-names QueueArn \
  --query 'Attributes.QueueArn' \
  --output text)

# Create event source mapping
aws lambda create-event-source-mapping \
  --function-name insurance-event-processor-prod \
  --event-source-arn $SQS_ARN \
  --batch-size 10 \
  --maximum-batching-window-in-seconds 5
```

## 🔄 **Updating Lambda Function**

### **Code Updates**
```bash
cd lambda

# Install dependencies
npm ci --only=production

# Create new deployment package
zip -r function-update.zip src/ package.json node_modules/

# Update function code
aws lambda update-function-code \
  --function-name insurance-event-processor-prod \
  --zip-file fileb://function-update.zip

# Update function configuration (if needed)
aws lambda update-function-configuration \
  --function-name insurance-event-processor-prod \
  --timeout 30 \
  --memory-size 128

# Clean up
rm function-update.zip
cd ..
```

### **Environment Variable Updates**
```bash
aws lambda update-function-configuration \
  --function-name insurance-event-processor-prod \
  --environment Variables='{
    "NODE_ENV": "production",
    "PARSE_APP_ID": "updated-parse-app-id",
    "PARSE_JS_KEY": "updated-parse-js-key",
    "PARSE_MASTER_KEY": "updated-parse-master-key",
    "PARSE_SERVER_URL": "https://updated-parse-server.com/parse"
  }'
```

## 📊 **Monitoring and Logs**

### **View Lambda Logs**
```bash
# Get log group name
aws logs describe-log-groups \
  --log-group-name-prefix /aws/lambda/insurance-event-processor-prod

# View recent logs
aws logs tail /aws/lambda/insurance-event-processor-prod --follow
```

### **Check SQS Metrics**
```bash
# Get queue attributes
aws sqs get-queue-attributes \
  --queue-url https://sqs.us-east-1.amazonaws.com/$ACCOUNT_ID/insurance-events-prod \
  --attribute-names All

# Get approximate number of messages
aws sqs get-queue-attributes \
  --queue-url https://sqs.us-east-1.amazonaws.com/$ACCOUNT_ID/insurance-events-prod \
  --attribute-names ApproximateNumberOfMessages
```

### **Test Lambda Function**
```bash
# Test with sample event
aws lambda invoke \
  --function-name insurance-event-processor-prod \
  --payload '{"Records":[{"messageId":"test","body":"{\"test\":\"data\"}"}]}' \
  response.json

# View response
cat response.json
rm response.json
```

## 🗑️ **Cleanup and Removal**

### **Remove Event Source Mapping**
```bash
# List event source mappings
aws lambda list-event-source-mappings \
  --function-name insurance-event-processor-prod

# Delete event source mapping
aws lambda delete-event-source-mapping \
  --uuid "your-uuid-here"
```

### **Delete Lambda Function**
```bash
aws lambda delete-function \
  --function-name insurance-event-processor-prod
```

### **Delete SQS Queues**
```bash
aws sqs delete-queue \
  --queue-url https://sqs.us-east-1.amazonaws.com/$ACCOUNT_ID/insurance-events-prod

aws sqs delete-queue \
  --queue-url https://sqs.us-east-1.amazonaws.com/$ACCOUNT_ID/insurance-events-dlq-prod
```

### **Delete IAM Role**
```bash
# Detach policies
aws iam detach-role-policy \
  --role-name insurance-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

aws iam detach-role-policy \
  --role-name insurance-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaSQSQueueExecutionRole

# Delete role
aws iam delete-role \
  --role-name insurance-lambda-role
```

## 🔧 **Troubleshooting**

### **Common Issues:**

1. **Permission Denied:**
   ```bash
   # Check your current identity
   aws sts get-caller-identity
   
   # Verify IAM permissions
   # You need: IAM, SQS, Lambda, CloudWatch permissions
   ```

2. **Role Not Found:**
   ```bash
   # Wait a few minutes after creating the role
   # IAM changes can take time to propagate
   ```

3. **Function Not Triggered:**
   ```bash
   # Check event source mapping
   aws lambda list-event-source-mappings \
     --function-name insurance-event-processor-prod
   
   # Check SQS queue for messages
   aws sqs get-queue-attributes \
     --queue-url your-queue-url \
     --attribute-names ApproximateNumberOfMessages
   ```

4. **Environment Variables Not Set:**
   ```bash
   # Check current configuration
   aws lambda get-function-configuration \
     --function-name insurance-event-processor-prod
   ```

## 📝 **Environment Variables Reference**

### **Required Variables:**
- `NODE_ENV`: `production`
- `PARSE_APP_ID`: Your Parse Server app ID
- `PARSE_JS_KEY`: Your Parse Server JavaScript key
- `PARSE_MASTER_KEY`: Your Parse Server master key
- `PARSE_SERVER_URL`: Your Parse Server URL

### **Optional Variables:**
- `LOG_LEVEL`: `info`, `debug`, `warn`, `error`
- `AWS_REGION`: `us-east-1` (or your region)

## 🎯 **Best Practices**

1. **Use different queue names** for different environments (dev, staging, prod)
2. **Set appropriate timeouts** based on your processing needs
3. **Monitor CloudWatch metrics** for performance insights
4. **Use dead letter queues** for failed message handling
5. **Test thoroughly** in staging before production
6. **Keep deployment packages small** by excluding unnecessary files
7. **Use environment variables** for configuration, not hardcoded values

## 🚀 **Quick Deployment Checklist**

- [ ] AWS CLI configured with credentials
- [ ] SQS queues created (main + DLQ)
- [ ] IAM role created with proper policies
- [ ] Lambda function deployed
- [ ] Event source mapping created
- [ ] Environment variables configured
- [ ] Function tested with sample data
- [ ] Monitoring and logging verified

## 📚 **Additional Resources**

- [AWS Lambda Developer Guide](https://docs.aws.amazon.com/lambda/latest/dg/)
- [AWS SQS Developer Guide](https://docs.aws.amazon.com/sqs/latest/dg/)
- [AWS IAM User Guide](https://docs.aws.amazon.com/IAM/latest/UserGuide/)
- [AWS CLI Command Reference](https://docs.aws.amazon.com/cli/latest/reference/)

This guide provides everything you need to deploy your insurance system to AWS using AWS Credentials Manager! 🎉
