# Lambda Event Source Mappings Configuration
# This file defines all Lambda event source mappings to SQS queues
# Execution Order: 07 - Event source mappings created after Lambda functions

# Travel Insurance Event Source Mappings
# These mappings connect SQS queues to their respective Lambda functions

# Travel Get Plan Event Source Mapping
# Connects TravelGetPlanQueue to TravelGetPlanLambda
resource "aws_lambda_event_source_mapping" "travel_get_plan_mapping" {
  event_source_arn = aws_sqs_queue.travel_get_plan.arn
  function_name    = aws_lambda_function.functions["travelGetPlan"].function_name
  batch_size       = var.lambda_batch_size
  starting_position = "LATEST"
}

# Travel Policy Event Source Mapping
# Connects TravelPolicyQueue to TravelPolicyServiceLambda
resource "aws_lambda_event_source_mapping" "travel_policy_mapping" {
  event_source_arn = aws_sqs_queue.travel_policy.arn
  function_name    = aws_lambda_function.functions["travelPolicyService"].function_name
  batch_size       = var.lambda_batch_size
  starting_position = "LATEST"
}

# Travel Payment Event Source Mapping
# Connects TravelPaymentQueue to TravelPaymentLambda
resource "aws_lambda_event_source_mapping" "travel_payment_mapping" {
  event_source_arn = aws_sqs_queue.travel_payment.arn
  function_name    = aws_lambda_function.functions["travelPayment"].function_name
  batch_size       = var.lambda_batch_size
  starting_position = "LATEST"
}

# Travel Notification Event Source Mapping
# Connects TravelNotificationQueue to TravelNotificationServiceLambda
resource "aws_lambda_event_source_mapping" "travel_notification_mapping" {
  event_source_arn = aws_sqs_queue.travel_notification.arn
  function_name    = aws_lambda_function.functions["travelNotificationService"].function_name
  batch_size       = var.lambda_batch_size
  starting_position = "LATEST"
}

# Travel Policy Cancellation Event Source Mapping
# Connects TravelPolicyCancellationQueue to TravelPolicyCancellationLambda
resource "aws_lambda_event_source_mapping" "travel_policy_cancellation_mapping" {
  event_source_arn = aws_sqs_queue.travel_policy_cancellation.arn
  function_name    = aws_lambda_function.functions["travelPolicyCancellation"].function_name
  batch_size       = var.lambda_batch_size
  starting_position = "LATEST"
}

# Travel Lead Event Source Mapping
# Connects TravelLeadQueue to TravelLeadLambda
resource "aws_lambda_event_source_mapping" "travel_lead_mapping" {
  event_source_arn = aws_sqs_queue.travel_lead.arn
  function_name    = aws_lambda_function.functions["travelLead"].function_name
  batch_size       = var.lambda_batch_size
  starting_position = "LATEST"
}
