// Parse Server cloud code
import Parse from 'parse/node.js';
import { getServiceType } from './helpers.js'

/**
 * Cloud function to create a new user with session or return existing user
 */
Parse.Cloud.define('createUser', async (request) => {
  // Get service type from parameter first, then fallback to detection
  const { serviceType: paramServiceType, ...otherParams } = request.params;
  const serviceType = paramServiceType || getServiceType(request);
  
  // Only allow main server to create users
  if (serviceType !== 'mainServer') {
    throw new Parse.Error(
      Parse.Error.OPERATION_FORBIDDEN,
      'Only main server can create users'
    );
  }
  
  const { insuranceType, email, phone, name, ipAddress, userAgent } = request.params;
  
  if (!insuranceType || !email) {
    throw new Parse.Error(
      Parse.Error.INVALID_QUERY,
      'Missing required parameters: insuranceType, email'
    );
  }
  
  try {
    // First, check if user already exists by email
    const userQuery = new Parse.Query('_User');
    userQuery.equalTo('email', email);
    const existingUser = await userQuery.first({ useMasterKey: true });
    
    if (existingUser) {
      // User exists, create a new session for them
      console.log(`User already exists: ${email}, creating new session`);
      
      const session = new Parse.Object('_Session');
      const sessionToken = `r:${Math.random().toString(36).slice(2, 32)}`;
      
      session.set('user', existingUser);
      session.set('sessionToken', sessionToken);
      session.set('installationId', `insurance_${insuranceType}_${Date.now()}`);
      session.set('restricted', false);
      session.set('expiresAt', new Date(Date.now() + 24 * 60 * 60 * 1000)); // 24 hours
      session.set('createdWith', {
        action: 'insurance-api',
        authProvider: 'existing-user',
        insuranceType: insuranceType
      });
      session.set('metadata', {
        insuranceType: insuranceType,
        ipAddress: ipAddress,
        userAgent: userAgent,
        createdAt: new Date()
      });
      
      await session.save(null, { useMasterKey: true });
      
      return {
        success: true,
        user: {
          id: existingUser.id,
          email: existingUser.get('email'),
          insuranceType: existingUser.get('insuranceType'),
          status: existingUser.get('status')
        },
        sessionToken: sessionToken,
        isNewUser: false
      };
    }
    
    // User doesn't exist, create new user
    console.log(`Creating new user: ${email}`);
    const user = new Parse.Object('_User');
    const username = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const password = `temp_${Math.random().toString(36).substr(2, 16)}`;
    
    user.set('username', username);
    user.set('password', password);
    user.set('email', email);
    user.set('insuranceType', insuranceType);
    user.set('phone', phone);
    user.set('name', name);
    user.set('status', 'active');
    user.set('metadata', {
      createdVia: 'insurance-api',
      ipAddress: ipAddress,
      userAgent: userAgent,
      createdAt: new Date()
    });
    
    // Set ACL - user can only access their own data
    const userACL = new Parse.ACL();
    userACL.setPublicReadAccess(false);
    userACL.setPublicWriteAccess(false);
    user.setACL(userACL);
    
    await user.save(null, { useMasterKey: true });
    
    // Create session
    const session = new Parse.Object('_Session');
    const sessionToken = `r:${Math.random().toString(36).slice(2, 32)}`;
    
    session.set('user', user);
    session.set('sessionToken', sessionToken);
    session.set('installationId', `insurance_${insuranceType}_${Date.now()}`);
    session.set('restricted', false);
    session.set('expiresAt', new Date(Date.now() + 24 * 60 * 60 * 1000)); // 24 hours
    session.set('createdWith', {
      action: 'insurance-api',
      authProvider: 'anonymous',
      insuranceType: insuranceType
    });
    session.set('metadata', {
      insuranceType: insuranceType,
      ipAddress: ipAddress,
      userAgent: userAgent,
      createdAt: new Date()
    });
    
    await session.save(null, { useMasterKey: true });
    
    return {
      success: true,
      user: {
        id: user.id,
        email: user.get('email'),
        insuranceType: user.get('insuranceType'),
        status: user.get('status')
      },
      sessionToken: sessionToken,
      isNewUser: true
    };
    
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
});

/**
 * Cloud function to log API calls
 */
Parse.Cloud.define('logAPICall', async (request) => {
  // Get service type from parameter first, then fallback to detection
  const { serviceType: paramServiceType, ...otherParams } = request.params;
  const serviceType = paramServiceType || getServiceType(request);
  
  // Only allow main server to log API calls
  if (serviceType !== 'mainServer') {
    throw new Parse.Error(
      Parse.Error.OPERATION_FORBIDDEN,
      'Only main server can log API calls'
    );
  }
  
  const { insuranceType, userId, requestId, endpoint, step, method, requestData, headers, ipAddress, userAgent } = request.params;
  
  if (!insuranceType || !userId || !requestId || !endpoint || !step) {
    throw new Parse.Error(
      Parse.Error.INVALID_QUERY,
      'Missing required parameters: insuranceType, userId, requestId, endpoint, step'
    );
  }
  
  try {
    const className = `${insuranceType.charAt(0).toUpperCase() + insuranceType.slice(1)}APILogs`;
    const LogClass = Parse.Object.extend(className);
    const logEntry = new LogClass();
    
    logEntry.set('userId', userId);
    logEntry.set('requestId', requestId);
    logEntry.set('endpoint', endpoint);
    logEntry.set('step', step);
    logEntry.set('method', method || 'POST');
    logEntry.set('status', 'pending');
    logEntry.set('request', requestData || {});
    logEntry.set('response', {});
    logEntry.set('headers', headers || {});
    logEntry.set('metadata', {
      insuranceType: insuranceType,
      environment: process.env.NODE_ENV || 'development'
    });
    logEntry.set('responseTime', 0);
    logEntry.set('ipAddress', ipAddress || '');
    logEntry.set('userAgent', userAgent || '');
    logEntry.set('timestamp', new Date());
    
    // Set ACL - only the user can access this record
    const acl = new Parse.ACL();
    acl.setPublicReadAccess(false);
    acl.setPublicWriteAccess(false);
    acl.setReadAccess(userId, true);
    acl.setWriteAccess(userId, true);
    logEntry.setACL(acl);
    
    const savedLog = await logEntry.save(null, { useMasterKey: true });
    
    return {
      success: true,
      logId: savedLog.id,
      message: 'API call logged successfully'
    };
    
  } catch (error) {
    console.error('Error logging API call:', error);
    throw error;
  }
});

/**
 * Cloud function to get user by session token
 */
Parse.Cloud.define('getUserBySessionToken', async (request) => {
  // Get service type from parameter first, then fallback to detection
  const { serviceType: paramServiceType, ...otherParams } = request.params;
  const serviceType = paramServiceType || getServiceType(request);
  
  // Only allow main server to get users by session
  if (serviceType !== 'mainServer') {
    throw new Parse.Error(
      Parse.Error.OPERATION_FORBIDDEN,
      'Only main server can get users by session token'
    );
  }
  
  const { sessionToken } = request.params;
  
  if (!sessionToken) {
    throw new Parse.Error(
      Parse.Error.INVALID_QUERY,
      'Missing required parameter: sessionToken'
    );
  }
  
  try {
    const sessionQuery = new Parse.Query('_Session');
    sessionQuery.equalTo('sessionToken', sessionToken);
    sessionQuery.include('user');
    
    const session = await sessionQuery.first({ useMasterKey: true });
    
    if (!session) {
      return { success: false, user: null };
    }
    
    // Check if session is expired
    const expiresAt = session.get('expiresAt');
    if (expiresAt && expiresAt < new Date()) {
      return { success: false, user: null };
    }
    
    // Check if session is restricted
    if (session.get('restricted')) {
      return { success: false, user: null };
    }
    
    const user = session.get('user');
    return {
      success: true,
      user: {
        id: user.id,
        email: user.get('email'),
        insuranceType: user.get('insuranceType'),
        status: user.get('status')
      }
    };
    
  } catch (error) {
    console.error('Error getting user by session token:', error);
    return { success: false, user: null };
  }
});

/**
 * Before save hook for all objects
 */
Parse.Cloud.beforeSave(Parse.Object, async (request) => {
  const serviceType = getServiceType(request);
  const className = request.object.className;
  
  console.log(`[SECURITY] Before save - Service: ${serviceType}, Class: ${className}`);
  
  // Check if service is allowed to access this collection
  if (!isCollectionAllowed(serviceType, className)) {
    throw new Parse.Error(
      Parse.Error.OPERATION_FORBIDDEN,
      `Service type '${serviceType}' is not allowed to access collection '${className}'`
    );
  }
  
  // Check if service is allowed to create objects
  if (!isOperationAllowed(serviceType, 'create')) {
    throw new Parse.Error(
      Parse.Error.OPERATION_FORBIDDEN,
      `Service type '${serviceType}' is not allowed to create objects in collection '${className}'`
    );
  }
  
  // Add service metadata to the object
  request.object.set('_serviceType', serviceType);
  request.object.set('_createdBy', serviceType);
  request.object.set('_createdAt', new Date());
});

// /**
//  * Before update hook for all objects
//  */
// Parse.Cloud.beforeUpdate(Parse.Object, async (request) => {
//   const serviceType = getServiceType(request);
//   const className = request.object.className;
  
//   console.log(`[SECURITY] Before update - Service: ${serviceType}, Class: ${className}`);
  
//   // Check if service is allowed to access this collection
//   if (!isCollectionAllowed(serviceType, className)) {
//     throw new Parse.Error(
//       Parse.Error.OPERATION_FORBIDDEN,
//       `Service type '${serviceType}' is not allowed to access collection '${className}'`
//     );
//   }
  
//   // Check if service is allowed to update objects
//   if (!isOperationAllowed(serviceType, 'update')) {
//     throw new Parse.Error(
//       Parse.Error.OPERATION_FORBIDDEN,
//       `Service type '${serviceType}' is not allowed to update objects in collection '${className}'`
//     );
//   }
  
//   // Add service metadata to the object
//   request.object.set('_updatedBy', serviceType);
//   request.object.set('_updatedAt', new Date());
// });

// /**
//  * Before delete hook for all objects
//  */
// Parse.Cloud.beforeDelete(Parse.Object, async (request) => {
//   const serviceType = getServiceType(request);
//   const className = request.object.className;
  
//   console.log(`[SECURITY] Before delete - Service: ${serviceType}, Class: ${className}`);
  
//   // Check if service is allowed to access this collection
//   if (!isCollectionAllowed(serviceType, className)) {
//     throw new Parse.Error(
//       Parse.Error.OPERATION_FORBIDDEN,
//       `Service type '${serviceType}' is not allowed to access collection '${className}'`
//     );
//   }
  
//   // Check if service is allowed to delete objects
//   if (!isOperationAllowed(serviceType, 'delete')) {
//     throw new Parse.Error(
//       Parse.Error.OPERATION_FORBIDDEN,
//       `Service type '${serviceType}' is not allowed to delete objects in collection '${className}'`
//     );
//   }
// });

// /**
//  * Before find hook for all objects
//  */
// Parse.Cloud.beforeFind(Parse.Object, async (request) => {
//   const serviceType = getServiceType(request);
//   const className = request.object.className;
  
//   console.log(`[SECURITY] Before find - Service: ${serviceType}, Class: ${className}`);
  
//   // Check if service is allowed to access this collection
//   if (!isCollectionAllowed(serviceType, className)) {
//     throw new Parse.Error(
//       Parse.Error.OPERATION_FORBIDDEN,
//       `Service type '${serviceType}' is not allowed to access collection '${className}'`
//     );
//   }
  
//   // Check if service is allowed to read objects
//   if (!isOperationAllowed(serviceType, 'read')) {
//     throw new Parse.Error(
//       Parse.Error.OPERATION_FORBIDDEN,
//       `Service type '${serviceType}' is not allowed to read objects in collection '${className}'`
//     );
//   }
// });

// /**
//  * Custom cloud function to get service permissions
//  */
// Parse.Cloud.define('getServicePermissions', async (request) => {
//   const serviceType = getServiceType(request);
  
//   return {
//     serviceType,
//     allowedCollections: ALLOWED_COLLECTIONS[serviceType] || [],
//     allowedOperations: ALLOWED_OPERATIONS[serviceType] || []
//   };
// });


//   console.log('Parse Server security hooks and cloud functions loaded successfully');
//   console.log('Available cloud functions:', [
//     'getServicePermissions',
//     'createUser', 
//     'logAPICall',
//     'updateAPILog',
//     'getUserBySessionToken'
//   ]);

