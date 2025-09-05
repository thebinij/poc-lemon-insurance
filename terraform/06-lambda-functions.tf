# Lambda Functions Configuration
# This file defines all Lambda functions for the travel insurance system
# Execution Order: 06 - Lambda functions created after subscriptions

# Local variables for Lambda functions
locals {
  lambda_functions = {
    # Travel Insurance Lambda Functions
    travelGetPlan = {
      name        = "TravelGetPlanLambda"
      handler     = "travelGetPlan/handler.handler"
      description = "Processes GetPlan requests. On success → write to TravelEventResponseQueue. On failure → write to TravelEventResponseQueue + trigger TravelNotificationQueue via TravelEventResponseSNS. Triggers TravelLeadQueue via TravelEventResponseSNS"
      timeout     = 30
      memory_size = 128
    }
    
    travelPolicyService = {
      name        = "TravelPolicyServiceLambda"
      handler     = "travelPolicyService/handler.handler"
      description = "Handles PolicyCreation / Update / Confirmation. On success → write to TravelEventResponseQueue. On failure → write to TravelEventResponseQueue + trigger TravelNotificationQueue via TravelEventResponseSNS. Triggers TravelPolicyCancellationQueue if step requires cancel. Triggers TravelLeadQueue via TravelEventResponseSNS"
      timeout     = 60
      memory_size = 256
    }
    
    travelPayment = {
      name        = "TravelPaymentLambda"
      handler     = "travelPayment/handler.handler"
      description = "Handles Purchase / Payment Confirmation. On success → write to TravelEventResponseQueue. On failure → write to TravelEventResponseQueue + trigger TravelNotificationQueue via TravelEventResponseSNS. Triggers TravelPolicyCancellationQueue if purchase fails. Triggers TravelLeadQueue via TravelEventResponseSNS"
      timeout     = 60
      memory_size = 256
    }
    
    travelNotificationService = {
      name        = "TravelNotificationServiceLambda"
      handler     = "travelNotificationService/handler.handler"
      description = "Sends notifications (popups, emails, etc.). Triggered by failure messages from TravelEventResponseSNS"
      timeout     = 30
      memory_size = 128
    }
    
    travelPolicyCancellation = {
      name        = "TravelPolicyCancellationLambda"
      handler     = "travelPolicyCancellation/handler.handler"
      description = "Handles policy rollback/cancellation triggered by failure in PolicyCreation, Confirmation, or Purchase"
      timeout     = 45
      memory_size = 128
    }
    
    travelLead = {
      name        = "TravelLeadLambda"
      handler     = "travelLead/handler.handler"
      description = "Processes lead generation for every step (success or failure) using UTM/source data"
      timeout     = 30
      memory_size = 128
    }
  }
}

# IAM Role for all Lambda functions
resource "aws_iam_role" "lambda_role" {
  name = "insurance-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# IAM Policy for Lambda basic execution
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Additional IAM policy for Lambda functions
resource "aws_iam_role_policy" "lambda_additional" {
  name = "insurance-lambda-additional-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      }
    ]
  })
}

# Create all Lambda functions
resource "aws_lambda_function" "functions" {
  for_each = local.lambda_functions

  function_name = each.value.name
  role         = aws_iam_role.lambda_role.arn
  handler      = each.value.handler
  runtime      = var.lambda_runtime
  timeout      = each.value.timeout
  memory_size  = each.value.memory_size
  description  = each.value.description

  # For LocalStack, use individual zip files
  filename = "lambdas/${each.key}.zip"


  tags = merge(local.common_tags, {
    Name        = each.value.name
    Function    = each.key
    Description = each.value.description
  })
}

# CloudWatch Log Groups for all Lambda functions
resource "aws_cloudwatch_log_group" "lambda_logs" {
  for_each = local.lambda_functions

  name              = "/aws/lambda/${each.value.name}"
  retention_in_days = 14

  tags = local.common_tags
}
