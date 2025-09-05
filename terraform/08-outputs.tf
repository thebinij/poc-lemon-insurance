# Outputs Configuration
# This file defines all Terraform outputs for the travel insurance system
# Execution Order: 08 - Outputs defined last

# SNS Topics Outputs
output "sns_topics" {
  description = "All SNS topics"
  value = {
    travel_event_request  = aws_sns_topic.travel_event_request.arn
    travel_event_response = aws_sns_topic.travel_event_response.arn
  }
}

# SQS Queues Outputs
output "sqs_queues" {
  description = "All SQS queues"
  value = {
    travel_get_plan              = aws_sqs_queue.travel_get_plan.url
    travel_policy                = aws_sqs_queue.travel_policy.url
    travel_payment               = aws_sqs_queue.travel_payment.url
    travel_notification          = aws_sqs_queue.travel_notification.url
    travel_event_response        = aws_sqs_queue.travel_event_response.url
    travel_policy_cancellation   = aws_sqs_queue.travel_policy_cancellation.url
    travel_lead                  = aws_sqs_queue.travel_lead.url
  }
}

# Lambda Functions Outputs
output "lambda_functions" {
  description = "All Lambda functions"
  value = {
    for key, func in aws_lambda_function.functions : key => {
      name       = func.function_name
      arn        = func.arn
      invoke_arn = func.invoke_arn
    }
  }
}

# Individual Lambda function outputs for easy access
output "travel_get_plan_lambda_name" {
  description = "Name of the Travel Get Plan Lambda Function"
  value       = aws_lambda_function.functions["travelGetPlan"].function_name
}

output "travel_get_plan_lambda_arn" {
  description = "ARN of the Travel Get Plan Lambda Function"
  value       = aws_lambda_function.functions["travelGetPlan"].arn
}

output "lambda_log_groups" {
  description = "CloudWatch Log Groups for all Lambda functions"
  value = {
    for key, log_group in aws_cloudwatch_log_group.lambda_logs : key => log_group.name
  }
}

# Test command outputs
output "test_commands" {
  description = "Commands to test the infrastructure"
  value = {
    travel_request_sns_publish = var.use_localstack ? "awslocal sns publish --topic-arn ${aws_sns_topic.travel_event_request.arn} --message '{\"eventType\":\"get_plan\",\"policyId\":\"123\"}'" : "aws sns publish --topic-arn ${aws_sns_topic.travel_event_request.arn} --message '{\"eventType\":\"get_plan\",\"policyId\":\"123\"}'"
    
    travel_response_sns_publish = var.use_localstack ? "awslocal sns publish --topic-arn ${aws_sns_topic.travel_event_response.arn} --message '{\"status\":\"success\",\"lead\":\"true\",\"policyId\":\"456\"}'" : "aws sns publish --topic-arn ${aws_sns_topic.travel_event_response.arn} --message '{\"status\":\"success\",\"lead\":\"true\",\"policyId\":\"456\"}'"
    
    travel_get_plan_queue_check = var.use_localstack ? "awslocal sqs get-queue-attributes --queue-url ${aws_sqs_queue.travel_get_plan.url} --attribute-names All" : "aws sqs get-queue-attributes --queue-url ${aws_sqs_queue.travel_get_plan.url} --attribute-names All"
  }
}
