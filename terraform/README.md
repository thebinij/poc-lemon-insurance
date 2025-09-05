# Infrastructure with Terraform

## Prerequisites

### For LocalStack Development
- [Terraform](https://www.terraform.io/downloads.html) >= 1.0
- [LocalStack](https://docs.localstack.cloud/getting-started/installation/) running
- [LocalStack CLI](https://docs.localstack.cloud/getting-started/installation/#localstack-cli) (`awslocal`)

### For AWS Production
- [Terraform](https://www.terraform.io/downloads.html) >= 1.0
- [AWS CLI](https://aws.amazon.com/cli/) configured
- AWS credentials with appropriate permissions

## Quick Start

### 1. Initialize Terraform

```bash
cd terraform
terraform init
```

### 2. Configure Variables

Copy the example variables file and modify as needed:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your desired configuration.

### 3. Deploy to LocalStack / AWS

```bash
# Set environment variables for LocalStack
export TF_VAR_use_localstack=true
export TF_VAR_environment=dev

# Set environment variables for AWS
export TF_VAR_use_localstack=false
export TF_VAR_environment=prod


# Plan the deployment
terraform plan -out=plan.out

# Validate terraform
terraform validate

# Apply the configuration
terraform apply "plan.out"
```

## Configuration

### Environment Variables

You can also set variables using environment variables:

```bash
export TF_VAR_use_localstack=true
export TF_VAR_environment=dev
export TF_VAR_aws_region=us-east-1
```

## LocalStack Development

### 1. Start LocalStack

```bash
# Using Docker
docker run -d -p 4566:4566 localstack/localstack

# Or using LocalStack CLI
localstack start
```

### 2. Deploy Infrastructure

```bash
cd terraform
export TF_VAR_use_localstack=true
terraform init
terraform plan
terraform apply
```

### 3. Test the Deployment

```bash
# Get the SNS topic ARN
awslocal sns list-topics

# Publish a test message
## Event Type: get_plan, policy_creation, policy_update, policy_confirmation, purchase_policy, purchase_confirmation
awslocal sns publish --topic-arn "$TOPIC_ARN" --message '{"eventType":"get_plan", "policyId":"123","testMessage":"Create Policy"}'

# Check SQS queue status
QUEUE_URL=$(terraform output -raw motor_sqs_queue_url)
awslocal sqs get-queue-attributes --queue-url "$QUEUE_URL" --attribute-names All

# Check Lambda logs
awslocal logs describe-log-groups --log-group-name-prefix /aws/lambda
```

### 4. Clean Up

```bash
terraform destroy
```

## AWS Production

### 1. Configure AWS Credentials

```bash
aws configure
# Or set environment variables
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_DEFAULT_REGION=us-east-1
```

### 2. Build Lambda Package

Before deploying to AWS, you need to build the Lambda package using your existing monorepo structure:

```bash
cd terraform
chmod +x build-lambda-packages.sh
./build-lambda-packages.sh
```

This will use your existing `package.json` and `npm run build` script to create a single `lambda-package.zip` file containing all Lambda functions with shared dependencies.

### 3. Deploy Infrastructure

```bash
export TF_VAR_use_localstack=false
export TF_VAR_environment=prod
terraform init
terraform plan
terraform apply
```

### 3. Test the Deployment

```bash
# Get the SNS topic ARN
TOPIC_ARN=$(terraform output -raw motor_sns_topic_arn)

# Publish a test message
## Event Type: get_plan, policy_creation, policy_update, policy_confirmation, purchase_policy, purchase_confirmation
aws sns publish --topic-arn "$TOPIC_ARN" --message '{"eventType":"get_plan","policyId":"123","testMessage":"Hello from AWS!"}'

# Check SQS queue status
QUEUE_URL=$(terraform output -raw motor_sqs_queue_url)
aws sqs get-queue-attributes --queue-url "$QUEUE_URL" --attribute-names All

# Check Lambda logs
aws logs describe-log-groups --log-group-name-prefix /aws/lambda
```

## Terraform Commands Reference

### Basic Commands

```bash
# Initialize Terraform
terraform init

# Show current state
terraform show

# Show plan
terraform plan

# Apply changes
terraform apply

# Apply with auto-approve
terraform apply -auto-approve

# Destroy resources
terraform destroy

# Destroy with auto-approve
terraform destroy -auto-approve
```

### Output Commands

```bash
# List all outputs
terraform output

# Get specific output
terraform output motor_sns_topic_arn
terraform output motor_sqs_queue_url
terraform output motor_lambda_function_name

# Get raw output (for scripts)
terraform output -raw motor_sns_topic_arn
```

### State Management

```bash
# List resources
terraform state list

# Show specific resource
terraform state show aws_sns_topic.motor_events

# Import existing resource
terraform import aws_sns_topic.motor_events arn:aws:sns:us-east-1:123456789012:motor-insurance-events

# Remove resource from state
terraform state rm aws_sns_topic.motor_events
```

## Troubleshooting

### Common Issues

1. **LocalStack not running**
   ```bash
   # Check if LocalStack is running
   awslocal sts get-caller-identity
   ```

2. **AWS credentials not configured**
   ```bash
   # Check AWS credentials
   aws sts get-caller-identity
   ```

3. **Terraform state issues**
   ```bash
   # Refresh state
   terraform refresh
   
   # Re-initialize
   rm -rf .terraform
   terraform init
   ```

4. **Lambda function not triggering**
   - Check SQS queue policy
   - Verify SNS subscription
   - Check Lambda event source mapping
   - Review CloudWatch logs

### Debugging

```bash
# Enable debug logging
export TF_LOG=DEBUG
terraform apply

# Check Terraform logs
export TF_LOG_PATH=terraform.log
terraform apply
```

## File Structure

```
terraform/
├── main.tf                    # Main Terraform configuration
├── variables.tf               # Variable definitions
├── lambda-functions.tf        # All Lambda functions configuration
├── motor-validation.tf        # Motor validation SNS/SQS resources
├── outputs.tf                 # Output definitions
├── terraform.tfvars.example   # Example variables file
├── build-lambda-packages.sh   # Script to build Lambda packages for AWS
└── README.md                  # This file
```

## Lambda Functions

The following Lambda functions are configured:

### Motor Insurance
- **MotorValidationLambda**: Motor insurance validation

### Travel Insurance
- **TravelGetPlanLambda**: Travel plan retrieval
- **TravelPolicyServiceLambda**: Travel policy service
- **TravelPaymentLambda**: Travel payment processing
- **TravelNotificationServiceLambda**: Travel notification service
- **TravelPolicyCancellationLambda**: Travel policy cancellation
- **TravelLeadLambda**: Travel lead processing

## Resources Created

### SNS
- **Topic**: `motor-insurance-events`
- **Subscription**: SQS queue subscription with filter policy

### SQS
- **Queue**: `motor-validation-queue`
- **Policy**: Allows SNS to send messages

### Lambda
- **Function**: `MotorValidationLambda`
- **Role**: IAM role with basic execution permissions
- **Event Source Mapping**: Triggers on SQS messages

### CloudWatch
- **Log Group**: `/aws/lambda/MotorValidationLambda`

## Security Considerations

- SQS queue policy restricts access to the specific SNS topic
- Lambda function uses least-privilege IAM role
- SNS subscription uses filter policy to only process validation events
- CloudWatch logs are retained for 14 days

## Cost Optimization

- SQS queue uses standard pricing (no FIFO)
- Lambda function uses minimal memory allocation
- CloudWatch logs have retention period set
- Resources can be easily destroyed when not needed

## Next Steps

1. **Add monitoring**: Set up CloudWatch alarms and dashboards
2. **Add CI/CD**: Integrate with GitHub Actions or similar
3. **Add more environments**: Create staging and production configurations
4. **Add more services**: Extend to include travel validation and other insurance types
5. **Add testing**: Include automated testing in the deployment pipeline
