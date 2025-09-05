# SNS Topics Configuration
# This file defines all SNS topics for the travel insurance system
# Execution Order: 02 - SNS topics created after variables

# Travel Event Request SNS Topic
# Purpose: Incoming API requests from frontend via Express server
resource "aws_sns_topic" "travel_event_request" {
  name = var.travel_event_request_topic_name

  tags = merge(local.common_tags, {
    Name        = "Travel Event Request SNS"
    Purpose     = "Incoming API requests from frontend"
    Service     = "travel"
    Environment = var.environment
  })
}

# Travel Event Response SNS Topic
# Purpose: Responses from Lambda (success or failure)
resource "aws_sns_topic" "travel_event_response" {
  name = var.travel_event_response_topic_name

  tags = merge(local.common_tags, {
    Name        = "Travel Event Response SNS"
    Purpose     = "Responses from Lambda functions"
    Service     = "travel"
    Environment = var.environment
  })
}
