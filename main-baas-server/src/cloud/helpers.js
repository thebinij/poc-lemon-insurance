// Define allowed collections for different service types
const ALLOWED_COLLECTIONS = {
  lambda: ['MotorAPILogs', 'TravelAPILogs'], // Lambda can only access API logs
  mainServer: ['_User', '_Session', 'MotorAPILogs', 'TravelAPILogs', 'User'], // Main server has full access
  admin: ['*'] // Admin has access to everything
};

// Define allowed operations for different service types
const ALLOWED_OPERATIONS = {
  lambda: ['read', 'update'], // Lambda can only read and update existing records
  mainServer: ['create', 'read', 'update', 'delete'], // Main server has full CRUD access
  admin: ['create', 'read', 'update', 'delete']
};

/**
 * Get service type from request headers or context
 */
function getServiceType(request) {
    // Handle cases where request or headers might be undefined
    const headers = request?.headers || {};
    const userAgent = headers['user-agent'] || '';
    const serviceType = headers['x-service-type'] || '';

    // Check for Lambda service type via headers (for HTTP requests)
    if (serviceType === 'lambda' || userAgent.includes('aws-lambda')) {
        return 'lambda';
    }

    // Check for main server via headers (for HTTP requests)
    if (serviceType === 'main-server' || userAgent.includes('main-baas-server')) {
        return 'mainServer';
    }

    // For direct Parse Cloud function calls (like from Lambda via SQS):
    // Check if this is a direct cloud function call without HTTP headers
    if (!headers || Object.keys(headers).length === 0 || 
        (!userAgent && !serviceType)) {
        
        // Method 1: Check AWS Lambda environment variables
        if (process.env.AWS_LAMBDA_FUNCTION_NAME || 
            process.env.AWS_EXECUTION_ENV ||
            process.env.LAMBDA_TASK_ROOT) {
            return 'lambda';
        }
        
        // Method 2: Check request context for Lambda-specific properties
        if (request?.context?.functionName || 
            request?.context?.awsRequestId) {
            return 'lambda';
        }
    }

    // Default to main server for backward compatibility
    return 'mainServer';
}

/**
 * Check if service type is allowed to access the collection
 */
function isCollectionAllowed(serviceType, className) {
  const allowedCollections = ALLOWED_COLLECTIONS[serviceType];
  
  if (!allowedCollections) {
    return false;
  }
  
  // Admin has access to everything
  if (allowedCollections.includes('*')) {
    return true;
  }
  
  return allowedCollections.includes(className);
}

/**
 * Check if service type is allowed to perform the operation
 */
function isOperationAllowed(serviceType, operation) {
  const allowedOperations = ALLOWED_OPERATIONS[serviceType];
  
  if (!allowedOperations) {
    return false;
  }
  
  return allowedOperations.includes(operation);
}


export { getServiceType, isCollectionAllowed, isOperationAllowed }