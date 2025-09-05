# SQS Queues Configuration
# This file defines all SQS queues for the travel insurance system
# Execution Order: 03 - SQS queues created after SNS topics

# Travel Get Plan Queue
# Linked Lambda: TravelGetPlanLambda
# Purpose: Processes GetPlan requests. Triggered by TravelEventRequestSNS
resource "aws_sqs_queue" "travel_get_plan" {
  name = var.travel_get_plan_queue_name

  visibility_timeout_seconds     = var.sqs_visibility_timeout
  message_retention_seconds      = var.sqs_message_retention_period
  max_message_size               = var.sqs_maximum_message_size
  receive_wait_time_seconds      = 0
  sqs_managed_sse_enabled        = true

  tags = merge(local.common_tags, {
    Name        = "Travel Get Plan Queue"
    Purpose     = "Processes GetPlan requests"
    Service     = "travel"
    Environment = var.environment
  })
}

# Travel Policy Queue
# Linked Lambda: TravelPolicyServiceLambda
# Purpose: Handles PolicyCreation, PolicyUpdation, PolicyConfirmation. Triggered by TravelEventRequestSNS
resource "aws_sqs_queue" "travel_policy" {
  name = var.travel_policy_queue_name

  visibility_timeout_seconds     = var.sqs_visibility_timeout
  message_retention_seconds      = var.sqs_message_retention_period
  max_message_size               = var.sqs_maximum_message_size
  receive_wait_time_seconds      = 0
  sqs_managed_sse_enabled        = true

  tags = merge(local.common_tags, {
    Name        = "Travel Policy Queue"
    Purpose     = "Handles Policy operations"
    Service     = "travel"
    Environment = var.environment
  })
}

# Travel Payment Queue
# Linked Lambda: TravelPaymentLambda
# Purpose: Handles PurchasePolicy, PurchaseConfirmation. Triggered by TravelEventRequestSNS
resource "aws_sqs_queue" "travel_payment" {
  name = var.travel_payment_queue_name

  visibility_timeout_seconds     = var.sqs_visibility_timeout
  message_retention_seconds      = var.sqs_message_retention_period
  max_message_size               = var.sqs_maximum_message_size
  receive_wait_time_seconds      = 0
  sqs_managed_sse_enabled        = true

  tags = merge(local.common_tags, {
    Name        = "Travel Payment Queue"
    Purpose     = "Handles Payment operations"
    Service     = "travel"
    Environment = var.environment
  })
}

# Travel Notification Queue
# Linked Lambda: TravelNotificationServiceLambda
# Purpose: Sends notifications for failures. Triggered by failure messages from TravelEventResponseSNS
resource "aws_sqs_queue" "travel_notification" {
  name = var.travel_notification_queue_name

  visibility_timeout_seconds     = var.sqs_visibility_timeout
  message_retention_seconds      = var.sqs_message_retention_period
  max_message_size               = var.sqs_maximum_message_size
  receive_wait_time_seconds      = 0
  sqs_managed_sse_enabled        = true

  tags = merge(local.common_tags, {
    Name        = "Travel Notification Queue"
    Purpose     = "Sends notifications for failures"
    Service     = "travel"
    Environment = var.environment
  })
}


# Travel Policy Cancellation Queue
# Linked Lambda: TravelPolicyCancellationLambda
# Purpose: Triggered when failure occurs in PolicyCreation, PolicyConfirmation, or Purchase step; handles compensating policy cancellation
resource "aws_sqs_queue" "travel_policy_cancellation" {
  name = var.travel_policy_cancellation_queue_name

  visibility_timeout_seconds     = var.sqs_visibility_timeout
  message_retention_seconds      = var.sqs_message_retention_period
  max_message_size               = var.sqs_maximum_message_size
  receive_wait_time_seconds      = 0
  sqs_managed_sse_enabled        = true

  tags = merge(local.common_tags, {
    Name        = "Travel Policy Cancellation Queue"
    Purpose     = "Handles policy rollback/cancellation"
    Service     = "travel"
    Environment = var.environment
  })
}

# Travel Lead Queue
# Linked Lambda: TravelLeadLambda
# Purpose: Triggered for every step, success or failure, to handle lead generation (UTM tracking, analytics)
resource "aws_sqs_queue" "travel_lead" {
  name = var.travel_lead_queue_name

  visibility_timeout_seconds     = var.sqs_visibility_timeout
  message_retention_seconds      = var.sqs_message_retention_period
  max_message_size               = var.sqs_maximum_message_size
  receive_wait_time_seconds      = 0
  sqs_managed_sse_enabled        = true

  tags = merge(local.common_tags, {
    Name        = "Travel Lead Queue"
    Purpose     = "Handles lead generation for every step"
    Service     = "travel"
    Environment = var.environment
  })
}
