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
# For LocalStack development
export TF_VAR_use_localstack=true
export TF_VAR_environment=dev

# For AWS production
export TF_VAR_use_localstack=false
export TF_VAR_environment=prod

# Deploy
terraform plan -out=plan.out
terraform apply "plan.out"
```

### 3. Test Deployment

```bash
# Start LocalStack
localstack start

# Get SNS topic ARN
awslocal sns list-topics

# Publish a test message
## Event Type: get_plan, policy_creation, policy_update, policy_confirmation, purchase_policy, purchase_confirmation
awslocal sns publish --topic-arn "$TOPIC_ARN" --message '{"policyId":"123","testMessage":"Get travel insurance plans"}' --message-attributes '{"eventType":{"DataType":"String","StringValue":"get_plan"}}'

# Check SQS queue
awslocal sqs list-queues

awslocal sqs get-queue-attributes --queue-url "$QUEUE_URL" --attribute-names All

# Check DynamoDB data
TABLE_NAME=$(terraform output -raw travel_event_responses_table_name)
awslocal dynamodb scan --table-name "$TABLE_NAME"
awslocal dynamodb query --table-name "$TABLE_NAME" --key-condition-expression "requestId = :reqId" --expression-attribute-values '{":reqId":{"S":"test-123"}}'

# Check Lambda logs
awslocal logs describe-log-groups --log-group-name-prefix /aws/lambda
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
