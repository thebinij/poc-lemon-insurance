# SQS Queue Policies Configuration
# This file defines all SQS queue policies to allow SNS to send messages
# Execution Order: 04 - SQS policies created after SQS queues

# Travel Get Plan Queue Policy
# Allows TravelEventRequestSNS to send messages
resource "aws_sqs_queue_policy" "travel_get_plan_policy" {
  queue_url = aws_sqs_queue.travel_get_plan.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = "*"
        Action = "sqs:SendMessage"
        Resource = aws_sqs_queue.travel_get_plan.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_sns_topic.travel_event_request.arn
          }
        }
      }
    ]
  })
}

# Travel Policy Queue Policy
# Allows TravelEventRequestSNS to send messages
resource "aws_sqs_queue_policy" "travel_policy_policy" {
  queue_url = aws_sqs_queue.travel_policy.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = "*"
        Action = "sqs:SendMessage"
        Resource = aws_sqs_queue.travel_policy.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_sns_topic.travel_event_request.arn
          }
        }
      }
    ]
  })
}

# Travel Payment Queue Policy
# Allows TravelEventRequestSNS to send messages
resource "aws_sqs_queue_policy" "travel_payment_policy" {
  queue_url = aws_sqs_queue.travel_payment.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = "*"
        Action = "sqs:SendMessage"
        Resource = aws_sqs_queue.travel_payment.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_sns_topic.travel_event_request.arn
          }
        }
      }
    ]
  })
}

# Travel Notification Queue Policy
# Allows TravelEventResponseSNS to send failure messages
resource "aws_sqs_queue_policy" "travel_notification_policy" {
  queue_url = aws_sqs_queue.travel_notification.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = "*"
        Action = "sqs:SendMessage"
        Resource = aws_sqs_queue.travel_notification.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_sns_topic.travel_event_response.arn
          }
        }
      }
    ]
  })
}

# Travel Event Response Queue Policy
# Allows all Lambda functions to send messages
resource "aws_sqs_queue_policy" "travel_event_response_policy" {
  queue_url = aws_sqs_queue.travel_event_response.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = "*"
        Action = "sqs:SendMessage"
        Resource = aws_sqs_queue.travel_event_response.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_sns_topic.travel_event_response.arn
          }
        }
      }
    ]
  })
}

# Travel Policy Cancellation Queue Policy
# Allows TravelEventResponseSNS to send cancellation messages
resource "aws_sqs_queue_policy" "travel_policy_cancellation_policy" {
  queue_url = aws_sqs_queue.travel_policy_cancellation.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = "*"
        Action = "sqs:SendMessage"
        Resource = aws_sqs_queue.travel_policy_cancellation.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_sns_topic.travel_event_response.arn
          }
        }
      }
    ]
  })
}

# Travel Lead Queue Policy
# Allows TravelEventResponseSNS to send lead messages
resource "aws_sqs_queue_policy" "travel_lead_policy" {
  queue_url = aws_sqs_queue.travel_lead.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = "*"
        Action = "sqs:SendMessage"
        Resource = aws_sqs_queue.travel_lead.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_sns_topic.travel_event_response.arn
          }
        }
      }
    ]
  })
}
