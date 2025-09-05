variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-southeast-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "lemon-insurance"
}

variable "use_localstack" {
  description = "Whether to use LocalStack instead of AWS"
  type        = bool
  default     = true
}

# SNS Topics
variable "travel_event_request_topic_name" {
  description = "Name of the SNS topic for travel event requests (incoming API requests from frontend)"
  type        = string
  default     = "TravelEventRequestSNS"
}

variable "travel_event_response_topic_name" {
  description = "Name of the SNS topic for travel event responses (responses from Lambda functions)"
  type        = string
  default     = "TravelEventResponseSNS"
}

# SQS Queues
variable "travel_get_plan_queue_name" {
  description = "Name of the SQS queue for travel get plan requests"
  type        = string
  default     = "TravelGetPlanQueue"
}

variable "travel_policy_queue_name" {
  description = "Name of the SQS queue for travel policy operations"
  type        = string
  default     = "TravelPolicyQueue"
}

variable "travel_payment_queue_name" {
  description = "Name of the SQS queue for travel payment operations"
  type        = string
  default     = "TravelPaymentQueue"
}

variable "travel_notification_queue_name" {
  description = "Name of the SQS queue for travel notifications"
  type        = string
  default     = "TravelNotificationQueue"
}

variable "travel_event_response_queue_name" {
  description = "Name of the SQS queue for travel event responses"
  type        = string
  default     = "TravelEventResponseQueue"
}

variable "travel_policy_cancellation_queue_name" {
  description = "Name of the SQS queue for travel policy cancellation"
  type        = string
  default     = "TravelPolicyCancellationQueue"
}

variable "travel_lead_queue_name" {
  description = "Name of the SQS queue for travel lead generation"
  type        = string
  default     = "TravelLeadQueue"
}

variable "sqs_visibility_timeout" {
  description = "SQS visibility timeout in seconds"
  type        = number
  default     = 90
}

variable "sqs_message_retention_period" {
  description = "SQS message retention period in seconds"
  type        = number
  default     = 1209600 # 14 days
}

variable "sqs_maximum_message_size" {
  description = "SQS maximum message size in bytes"
  type        = number
  default     = 262144 # 256 KB
}

variable "lambda_batch_size" {
  description = "Lambda event source mapping batch size"
  type        = number
  default     = 10
}

variable "lambda_runtime" {
  description = "Lambda runtime for all functions"
  type        = string
  default     = "nodejs20.x"
}

# DynamoDB Variables
variable "travel_event_responses_table_name" {
  description = "Name of the DynamoDB table for storing travel event responses"
  type        = string
  default     = "TravelEventResponses"
}

variable "dynamodb_ttl_minutes" {
  description = "TTL in minutes for DynamoDB items (items will be automatically deleted after this time)"
  type        = number
  default     = 1
}
