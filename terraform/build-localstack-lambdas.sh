#!/bin/bash
set -euo pipefail

# Build individual Lambda packages for LocalStack development
echo "Building individual Lambda packages for LocalStack..."

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

# Create lambdas directory in terraform folder and clean old files
print_status "Creating lambdas directory and cleaning old files..."
mkdir -p ../terraform/lambdas
rm -f ../terraform/lambdas/*.zip

# Create individual zip files for each Lambda function
lambda_functions=("travelGetPlan" "travelPolicyService" "travelPayment" "travelNotificationService" "travelPolicyCancellation" "travelLead")

for func in "${lambda_functions[@]}"; do
    print_status "Building $func Lambda package..."
    
    # Create a temporary directory for this function
    mkdir -p "temp_$func"
    
    # Copy the function handler
    cp "$func/handler.js" "temp_$func/"
    
    # Copy package.json and node_modules
    cp package.json "temp_$func/"
    cp -r node_modules "temp_$func/"
    
    # Create zip file
    cd "temp_$func"
    zip -r "../$func.zip" .
    cd ..
    
    # Move to terraform directory
    mv "$func.zip" "../terraform/lambdas/$func.zip"
    
    # Clean up
    rm -rf "temp_$func"
    
    print_success "$func Lambda package created: $func.zip"
done

print_success "All Lambda packages built successfully!"
echo ""
echo "Individual packages created:"
for func in "${lambda_functions[@]}"; do
    echo "  - $func.zip"
done
echo ""
echo "You can now run 'terraform apply' to deploy to LocalStack"
