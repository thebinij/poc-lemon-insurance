#!/bin/bash
set -euo pipefail

# Build Lambda deployment package for AWS (monorepo approach)
echo "Building Lambda deployment package for AWS..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Navigate to lambda directory
cd ../lambda

print_status "Installing dependencies..."
npm install

print_status "Building Lambda package with all Lambda directories..."
# Create zip with all Lambda function directories
zip -r function-prod.zip \
  travelGetPlan/ \
  travelPolicyService/ \
  travelPayment/ \
  travelNotificationService/ \
  travelPolicyCancellation/ \
  travelLead/ \
  package.json \
  node_modules/

# Move the built package to terraform directory
mv function-prod.zip ../terraform/lambda-package.zip

print_success "Lambda package built successfully!"
echo ""
echo "Package created: lambda-package.zip"
echo "This package contains all Lambda functions with shared dependencies"
echo ""
echo "Lambda functions included:"
echo "  - travelGetPlan/"
echo "  - travelPolicyService/"
echo "  - travelPayment/"
echo "  - travelNotificationService/"
echo "  - travelPolicyCancellation/"
echo "  - travelLead/"
echo ""
echo "You can now run 'terraform apply' to deploy to AWS"
