# DynamoDB Configuration
# This file defines DynamoDB table for storing travel event responses with TTL
# Execution Order: 07 - DynamoDB created after Lambda functions but before event mappings

# DynamoDB Table for Travel Event Responses
# Purpose: Store travel event responses temporarily with TTL for querying by requestId
resource "aws_dynamodb_table" "travel_event_responses" {
  name           = var.travel_event_responses_table_name
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "requestId"
  
  # TTL configuration - items will be automatically deleted after TTL expires
  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  attribute {
    name = "requestId"
    type = "S"
  }

  # Global Secondary Index for querying by eventType
  global_secondary_index {
    name            = "EventTypeIndex"
    hash_key        = "eventType"
    projection_type = "ALL"
  }

  attribute {
    name = "eventType"
    type = "S"
  }

  tags = merge(local.common_tags, {
    Name        = "Travel Event Responses Table"
    Purpose     = "Store travel event responses with TTL"
    Service     = "travel"
    Environment = var.environment
  })
}

# IAM Role for DynamoDB Lambda Function
resource "aws_iam_role" "dynamodb_lambda_role" {
  name = "${var.project_name}-${var.environment}-dynamodb-lambda-role"

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

  tags = merge(local.common_tags, {
    Name        = "DynamoDB Lambda Role"
    Purpose     = "IAM role for Lambda function to write to DynamoDB"
    Service     = "travel"
    Environment = var.environment
  })
}

# IAM Policy for DynamoDB access
resource "aws_iam_policy" "dynamodb_lambda_policy" {
  name        = "${var.project_name}-${var.environment}-dynamodb-lambda-policy"
  description = "Policy for Lambda function to access DynamoDB"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.travel_event_responses.arn,
          "${aws_dynamodb_table.travel_event_responses.arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name        = "DynamoDB Lambda Policy"
    Purpose     = "IAM policy for Lambda function to access DynamoDB"
    Service     = "travel"
    Environment = var.environment
  })
}

# Attach policy to role
resource "aws_iam_role_policy_attachment" "dynamodb_lambda_policy_attachment" {
  role       = aws_iam_role.dynamodb_lambda_role.name
  policy_arn = aws_iam_policy.dynamodb_lambda_policy.arn
}

# CloudWatch Log Group for DynamoDB Lambda
resource "aws_cloudwatch_log_group" "dynamodb_lambda_logs" {
  name              = "/aws/lambda/${var.project_name}-${var.environment}-dynamodb-processor"
  retention_in_days = 14

  tags = merge(local.common_tags, {
    Name        = "DynamoDB Lambda Log Group"
    Purpose     = "CloudWatch logs for DynamoDB Lambda function"
    Service     = "travel"
    Environment = var.environment
  })
}

# Lambda Function to process SNS messages and write to DynamoDB
resource "aws_lambda_function" "dynamodb_processor" {
  function_name = "${var.project_name}-${var.environment}-dynamodb-processor"
  role          = aws_iam_role.dynamodb_lambda_role.arn
  handler       = "dynamodbProcessor/handler.handler"
  runtime       = var.lambda_runtime
  timeout       = 30

  filename         = "lambdas/dynamodbProcessor.zip"
  source_code_hash = data.archive_file.dynamodb_processor_zip.output_base64sha256

  environment {
    variables = merge(
      {
        DYNAMODB_TABLE_NAME            = aws_dynamodb_table.travel_event_responses.name
        TTL_MINUTES                   = var.dynamodb_ttl_minutes
        TRAVEL_EVENT_RESPONSE_TOPIC_ARN = aws_sns_topic.travel_event_response.arn
      },
      var.use_localstack ? { AWS_ENDPOINT_URL = "http://localhost:4566" } : {}
    )
  }

  depends_on = [
    aws_cloudwatch_log_group.dynamodb_lambda_logs,
    aws_iam_role_policy_attachment.dynamodb_lambda_policy_attachment
  ]

  tags = merge(local.common_tags, {
    Name        = "DynamoDB Processor Lambda"
    Purpose     = "Process SNS messages and write to DynamoDB"
    Service     = "travel"
    Environment = var.environment
  })
}

# Create Lambda deployment package
data "archive_file" "dynamodb_processor_zip" {
  type        = "zip"
  output_path = "lambdas/dynamodbProcessor.zip"
  source_dir  = "${path.module}/../lambda"
  excludes    = ["node_modules", ".git", "*.md", ".DS_Store"]
}

# SNS Lambda Permission
# Allow SNS to invoke the DynamoDB processor Lambda function
resource "aws_lambda_permission" "allow_sns_dynamodb_processor" {
  statement_id  = "AllowExecutionFromSNS"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.dynamodb_processor.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.travel_event_response.arn
}
