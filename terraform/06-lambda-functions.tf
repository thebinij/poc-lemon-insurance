# Lambda Functions Configuration
# This file defines all Lambda functions for the travel insurance system
# Execution Order: 06 - Lambda functions created after subscriptions

# Local variables for Lambda functions
locals {
  lambda_functions = {

    travelGetPlan = {
      name        = "TravelGetPlanLambda"
      handler     = "travelGetPlan/handler.handler"
      description = "Processes GetPlan requests and handles responses"
      timeout     = 30
      memory_size = 128
    }
    
    travelPolicyService = {
      name        = "TravelPolicyServiceLambda"
      handler     = "travelPolicyService/handler.handler"
      description = "Handles PolicyCreation, Update, and Confirmation"
      timeout     = 60
      memory_size = 256
    }
    
    travelPayment = {
      name        = "TravelPaymentLambda"
      handler     = "travelPayment/handler.handler"
      description = "Handles Purchase and Payment Confirmation"
      timeout     = 60
      memory_size = 256
    }
    
    travelNotificationService = {
      name        = "TravelNotificationServiceLambda"
      handler     = "travelNotificationService/handler.handler"
      description = "Sends notifications for failures"
      timeout     = 30
      memory_size = 128
    }
    
    travelPolicyCancellation = {
      name        = "TravelPolicyCancellationLambda"
      handler     = "travelPolicyCancellation/handler.handler"
      description = "Handles policy rollback and cancellation"
      timeout     = 45
      memory_size = 128
    }
    
    travelLead = {
      name        = "TravelLeadLambda"
      handler     = "travelLead/handler.handler"
      description = "Processes lead generation for every step"
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

  environment {
    variables = merge(
      {
        TRAVEL_EVENT_RESPONSE_TOPIC_ARN = aws_sns_topic.travel_event_response.arn
      },
      var.use_localstack ? { AWS_ENDPOINT_URL = "http://localhost:4566" } : {}
    )
  }

  tags = merge(local.common_tags, {
    Name     = each.value.name
    Function = each.key
  })
}

# CloudWatch Log Groups for all Lambda functions
resource "aws_cloudwatch_log_group" "lambda_logs" {
  for_each = local.lambda_functions

  name              = "/aws/lambda/${each.value.name}"
  retention_in_days = 14

  tags = local.common_tags
}
