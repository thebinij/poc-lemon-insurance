# Infrastructure with Terraform

## Prerequisites
- [Terraform](https://www.terraform.io/downloads.html) >= 1.0
- For LocalStack: [LocalStack](https://docs.localstack.cloud/getting-started/installation/) running
- For AWS: [AWS CLI](https://aws.amazon.com/cli/) configured with credentials

## Quick Start

### 1. Initialize and Configure

```bash
cd terraform
terraform init

# Copy and edit variables
cp terraform.tfvars.example terraform.tfvars
```

### 2. Deploy Infrastructure

```bash
# Development (LocalStack)
export TF_VAR_use_localstack=true
export TF_VAR_environment=dev
localstack start

# Production (AWS)
export TF_VAR_use_localstack=false
export TF_VAR_environment=prod

# Deploy
terraform plan -out=plan.out
terraform apply "plan.out"
```

### 3. Test Deployment

```bash
# SNS
awslocal sns list-topics
aws sns list-topics

TOPIC_ARN=...
awslocal sns publish --topic-arn "$TOPIC_ARN" \
  --message '{"policyId":"123","testMessage":"Get travel insurance plans"}' \
  --message-attributes '{"eventType":{"DataType":"String","StringValue":"get_plan"}}'

# SQS
awslocal sqs list-queues
aws sqs list-queues

QUEUE_URL=...
awslocal sqs get-queue-attributes --queue-url "$QUEUE_URL" --attribute-names All
aws sqs get-queue-attributes --queue-url "$QUEUE_URL" --attribute-names All

# Get SNS topic ARN
awslocal sns list-topics
aws sns list-topics

# List SQS queues
awslocal sqs list-queues
aws sqs list-queues

# Lambda logs
awslocal logs describe-log-groups --log-group-name-prefix /aws/lambda
aws logs describe-log-groups --log-group-name-prefix /aws/lambda

# Receive one message from queue (dev example shown)
awslocal sqs receive-message \
  --queue-url "http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/TravelEventResponseQueue" \
  --max-number-of-messages 1

# DynamoDB
TABLE_NAME=$(terraform output -raw travel_event_responses_table_name)
awslocal dynamodb scan --table-name "$TABLE_NAME"
aws dynamodb scan --table-name "$TABLE_NAME"

awslocal dynamodb query --table-name "$TABLE_NAME" \
  --key-condition-expression "requestId = :reqId" \
  --expression-attribute-values '{":reqId":{"S":"test-123"}}'

# Logs
awslocal logs describe-log-groups --log-group-name-prefix "/aws/lambda/Travel"
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/Travel"

awslocal logs describe-log-streams \
  --log-group-name "/aws/lambda/TravelGetPlanLambda" \
  --order-by LastEventTime --descending --max-items 1

awslocal logs get-log-events \
  --log-group-name "/aws/lambda/TravelGetPlanLambda" \
  --log-stream-name "2025/09/05/[\$LATEST]e37e9ccde226deb46228570b53ec610b"

awslocal logs describe-log-groups \
  --log-group-name-prefix "/aws/lambda/Travel" \
  --query 'logGroups[*].{Name:logGroupName,StoredBytes:storedBytes}' \
  --output table

# Publish a test message
## Event Type: get_plan, policy_creation, policy_update, policy_confirmation, purchase_policy, purchase_confirmation
awslocal sns publish --topic-arn "$TOPIC_ARN" --message '{"policyId":"123","testMessage":"Get travel insurance plans"}' --message-attributes '{"eventType":{"DataType":"String","StringValue":"get_plan"}}'

# Get SQS queue attributes


```

### 4. Clean Up

```bash
terraform destroy
```


## Troubleshooting

```bash
# Check LocalStack status
awslocal sts get-caller-identity

# Check AWS credentials
aws sts get-caller-identity

# Refresh Terraform state
terraform refresh
```
