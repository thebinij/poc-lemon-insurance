const Parse = require('parse-server').ParseServer;
const FSFilesAdapter = require('parse-server-fs-adapter');

const parseConfig = {
  databaseURI: process.env.MONGODB_URI || 'mongodb://localhost:27017/lemon-insurance',
  appId: process.env.PARSE_APP_ID || 'lemon-insurance-app-id',
  masterKey: process.env.PARSE_MASTER_KEY || 'lemon-insurance-master-key',
  serverURL: process.env.PARSE_SERVER_URL || 'http://localhost:1337/parse',
  publicServerURL: process.env.PARSE_PUBLIC_SERVER_URL || 'http://localhost:1337/parse',
  
  // Security settings
  allowClientClassCreation: false,
  allowCustomObjectId: false,
  enableAnonymousUsers: false,
  
  // File storage (using local file system for development)
  filesAdapter: new FSFilesAdapter({
    filesSubDirectory: 'files'
  }),
  
  // LiveQuery (optional)
  liveQuery: {
    classNames: ['User', 'AuthEvent', 'Workflow']
  },
  
  // Logging
  verbose: process.env.NODE_ENV === 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  
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
        status: { type: 'String', defaultValue: 'work' },
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

module.exports = parseConfig;
