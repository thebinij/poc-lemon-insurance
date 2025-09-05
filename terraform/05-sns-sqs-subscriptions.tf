# SNS-SQS Subscriptions Configuration
# This file defines all SNS to SQS subscriptions with proper filter policies
# Execution Order: 05 - Subscriptions created after SQS policies

# TravelEventRequestSNS Subscriptions
# These queues are triggered by incoming API requests from frontend

# Travel Get Plan Subscription
# Triggered by TravelEventRequestSNS for GetPlan requests
resource "aws_sns_topic_subscription" "travel_get_plan_request" {
  topic_arn = aws_sns_topic.travel_event_request.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.travel_get_plan.arn

  filter_policy_scope = "MessageBody"
  filter_policy = jsonencode({
    eventType = ["get_plan"]
  })

  raw_message_delivery = true
}

# Travel Policy Subscription
# Triggered by TravelEventRequestSNS for Policy operations
resource "aws_sns_topic_subscription" "travel_policy_request" {
  topic_arn = aws_sns_topic.travel_event_request.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.travel_policy.arn

  filter_policy_scope = "MessageBody"
  filter_policy = jsonencode({
    eventType = ["policy_creation", "policy_update", "policy_confirmation"]
  })

  raw_message_delivery = true
}

# Travel Payment Subscription
# Triggered by TravelEventRequestSNS for Payment operations
resource "aws_sns_topic_subscription" "travel_payment_request" {
  topic_arn = aws_sns_topic.travel_event_request.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.travel_payment.arn

  filter_policy_scope = "MessageBody"
  filter_policy = jsonencode({
    eventType = ["purchase_policy", "purchase_confirmation"]
  })

  raw_message_delivery = true
}

# TravelEventResponseSNS Subscriptions
# These queues are triggered by Lambda responses (success or failure)

# Travel Notification Subscription
# Triggered by TravelEventResponseSNS for failure notifications
resource "aws_sns_topic_subscription" "travel_notification_response" {
  topic_arn = aws_sns_topic.travel_event_response.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.travel_notification.arn

  filter_policy_scope = "MessageBody"
  filter_policy = jsonencode({
    status = ["failure"]
    notification = ["true"]
  })

  raw_message_delivery = true
}

# Travel Policy Cancellation Subscription
# Triggered by TravelEventResponseSNS for policy cancellations
resource "aws_sns_topic_subscription" "travel_policy_cancellation_response" {
  topic_arn = aws_sns_topic.travel_event_response.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.travel_policy_cancellation.arn

  filter_policy_scope = "MessageBody"
  filter_policy = jsonencode({
    status = ["failure"]
    cancellation = ["true"]
  })

  raw_message_delivery = true
}

# Travel Lead Subscription
# Triggered by TravelEventResponseSNS for all events (success or failure)
resource "aws_sns_topic_subscription" "travel_lead_response" {
  topic_arn = aws_sns_topic.travel_event_response.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.travel_lead.arn

  filter_policy_scope = "MessageBody"
  filter_policy = jsonencode({
    lead = ["true"]
  })

  raw_message_delivery = true
}
