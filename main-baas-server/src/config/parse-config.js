const Parse = require('parse-server').ParseServer;
const config = require('./environment');

const parseConfig = {
  databaseURI: config.mongodb.uri,
  
  appId: config.parse.appId,
  masterKey: config.parse.masterKey,
  serverURL: config.parse.serverUrl,
  publicServerURL: config.parse.publicServerUrl,
  
  // Security settings
  allowClientClassCreation: false,
  allowCustomObjectId: false,
  enableAnonymousUsers: false,
  
  // LiveQuery (optional)
  liveQuery: {
    classNames: ['User', 'AuthEvent', 'Workflow']
  },
  
  // Logging - use environment configuration
  verbose: config.isDevelopment(),
  logLevel: config.logging.level,
  
  // Custom Parse Server options
  maxUploadSize: '20mb',
  preserveFileName: true,
  
  // Custom schemas and classes
  schema: {
    User: {
      fields: {
        email: { type: 'String', required: true, unique: true },
        firstName: { type: 'String', required: true },
        lastName: { type: 'String', required: true },
        password: { type: 'String', required: true },
        status: { type: 'String', defaultValue: 'active' },
        lastLoginAt: { type: 'Date' },
        metadata: { type: 'Object' }
      }
    },
    AuthEvent: {
      fields: {
        eventType: { type: 'String', required: true },
        userId: { type: 'String', required: true },
        email: { type: 'String', required: true },
        timestamp: { type: 'Date', required: true },
        status: { type: 'String', defaultValue: 'active' },
        metadata: { type: 'Object' }
      }
    },
    Workflow: {
      fields: {
        name: { type: 'String', required: true },
        status: { type: 'String', defaultValue: 'pending' },
        userId: { type: 'String', required: true },
        data: { type: 'Object' },
        createdAt: { type: 'Date', required: true },
        updatedAt: { type: 'Date', required: true }
      }
    }
  }
};

// Validate configuration before exporting
try {
  config.validate();
} catch (error) {
  console.error('Parse Server configuration validation failed:', error.message);
  process.exit(1);
}

module.exports = parseConfig;