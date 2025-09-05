terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Configure the AWS Provider
provider "aws" {
  region = var.aws_region
  
  # For LocalStack
  skip_credentials_validation = var.use_localstack
  skip_metadata_api_check     = var.use_localstack
  skip_requesting_account_id  = var.use_localstack
  
  endpoints = var.use_localstack ? {
    sns     = "http://localhost:4566"
    sqs     = "http://localhost:4566"
    lambda  = "http://localhost:4566"
    iam     = "http://localhost:4566"
    logs    = "http://localhost:4566"
  } : {}
}

# Data sources
data "aws_caller_identity" "current" {}

# Local variables
locals {
  account_id = var.use_localstack ? "000000000000" : data.aws_caller_identity.current.account_id
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}
