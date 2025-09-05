#!/bin/bash
set -euo pipefail

# Build individual Lambda packages for LocalStack development using monorepo approach
echo "Building Lambda packages using monorepo approach..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [--lambdas function1,function2,...]"
    echo ""
    echo "Options:"
    echo "  --lambdas    Comma-separated list of Lambda functions to build"
    echo "               Available functions: travelGetPlan, travelPolicyService, travelPayment,"
    echo "               travelNotificationService, travelPolicyCancellation, travelLead, dynamodbProcessor"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Build all Lambda functions"
    echo "  $0 --lambdas dynamodbProcessor       # Build only DynamoDB processor"
    echo "  $0 --lambdas travelGetPlan,travelPayment  # Build specific functions"
    echo ""
}

# Parse command line arguments
LAMBDA_FUNCTIONS=""
if [[ $# -gt 0 ]]; then
    if [[ "$1" == "--lambdas" ]]; then
        if [[ $# -lt 2 ]]; then
            echo "Error: --lambdas requires a comma-separated list of function names"
            show_usage
            exit 1
        fi
        LAMBDA_FUNCTIONS="$2"
    elif [[ "$1" == "--help" || "$1" == "-h" ]]; then
        show_usage
        exit 0
    else
        echo "Error: Unknown option '$1'"
        show_usage
        exit 1
    fi
fi

# Navigate to lambda directory
cd ../lambda

print_status "Installing all dependencies..."
npm install

# Create lambdas directory in terraform folder
print_status "Creating lambdas directory..."
mkdir -p ../terraform/lambdas

# Define all available Lambda functions
all_lambda_functions=("travelGetPlan" "travelPolicyService" "travelPayment" "travelNotificationService" "travelPolicyCancellation" "travelLead" "dynamodbProcessor")

# Function to validate function name
is_valid_function() {
    local func_name="$1"
    for valid_func in "${all_lambda_functions[@]}"; do
        if [[ "$func_name" == "$valid_func" ]]; then
            return 0
        fi
    done
    return 1
}

# Function to get dependencies based on function name
get_dependencies() {
    local func_name="$1"
    case "$func_name" in
        "dynamodbProcessor")
            echo "@aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb"
            ;;
        *)
            echo "@aws-sdk/client-sns uuid parse mongodb"
            ;;
    esac
}

# Function to get dependency type for display
get_dep_type() {
    local func_name="$1"
    case "$func_name" in
        "dynamodbProcessor")
            echo "dynamodb"
            ;;
        *)
            echo "travel"
            ;;
    esac
}

# Determine which functions to build
if [[ -n "$LAMBDA_FUNCTIONS" ]]; then
    # Parse comma-separated list
    IFS=',' read -ra FUNC_ARRAY <<< "$LAMBDA_FUNCTIONS"
    lambda_functions=()
    
    for func in "${FUNC_ARRAY[@]}"; do
        # Trim whitespace
        func=$(echo "$func" | xargs)
        
        if is_valid_function "$func"; then
            lambda_functions+=("$func")
        else
            print_warning "Invalid function name: '$func'. Skipping..."
        fi
    done
    
    if [[ ${#lambda_functions[@]} -eq 0 ]]; then
        echo "Error: No valid function names provided"
        show_usage
        exit 1
    fi
    
    print_status "Building selected Lambda functions: ${lambda_functions[*]}"
else
    # Build all functions
    lambda_functions=("${all_lambda_functions[@]}")
    print_status "Building all Lambda functions: ${lambda_functions[*]}"
fi

for func in "${lambda_functions[@]}"; do
    dep_type=$(get_dep_type "$func")
    deps=$(get_dependencies "$func")
    
    print_status "Building $func Lambda package (type: $dep_type)..."
    
    # Remove existing zip file for this specific function
    if [[ -f "../terraform/lambdas/$func.zip" ]]; then
        print_status "Removing existing $func.zip..."
        rm -f "../terraform/lambdas/$func.zip"
    fi
    
    # Create a temporary directory for this function
    mkdir -p "temp_$func"
    
    # Copy the function handler
    cp "$func/handler.js" "temp_$func/"
    
    # Copy package.json
    cp package.json "temp_$func/"
    
    # Install only the required dependencies
    cd "temp_$func"
    print_status "Installing dependencies for $func: $deps"
    npm install --omit=dev --no-package-lock $deps
    cd ..
    
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

if [[ ${#lambda_functions[@]} -eq ${#all_lambda_functions[@]} ]]; then
    print_success "All Lambda packages built successfully!"
else
    print_success "Selected Lambda packages built successfully!"
fi

echo ""
echo "Packages created:"
for func in "${lambda_functions[@]}"; do
    dep_type=$(get_dep_type "$func")
    echo "  - $func.zip ($dep_type type)"
done
echo ""
echo "You can now run 'terraform apply' to deploy to LocalStack"
