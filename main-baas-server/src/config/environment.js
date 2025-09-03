
// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

const config = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    host: process.env.HOST || '0.0.0.0'  // Bind to all interfaces
  },

  // Parse Server Configuration
  parse: {
    serverUrl: process.env.PARSE_SERVER_URL,
    appId: process.env.PARSE_APP_ID || 'lemon-insurance-app-id',
    masterKey: process.env.PARSE_MASTER_KEY || 'lemon-insurance-master-key',
    jsKey: process.env.PARSE_JS_KEY || 'lemon-insurance-js-key',
    publicServerUrl: process.env.PARSE_PUBLIC_SERVER_URL,
  },

  // AWS Configuration
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
    endpoint: process.env.AWS_ENDPOINT || 'http://localhost:4566',
    useLocalStack: process.env.USE_LOCALSTACK === 'true' || process.env.NODE_ENV === 'development'
  },

  // SQS Configuration
  sqs: {
    queueName: process.env.SQS_QUEUE_NAME || 'insurance-events',
    queueUrl: process.env.SQS_QUEUE_URL || 'http://localhost:4566/000000000000/insurance-events',
    visibilityTimeout: parseInt(process.env.SQS_VISIBILITY_TIMEOUT) || 30,
    messageRetentionPeriod: parseInt(process.env.SQS_MESSAGE_RETENTION_PERIOD) || 1209600,
    maximumMessageSize: parseInt(process.env.SQS_MAXIMUM_MESSAGE_SIZE) || 262144
  },

  // MongoDB Configuration
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/lemon-insurance',
    database: process.env.MONGODB_DATABASE || 'lemon-insurance',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE) || 10,
      serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT) || 5000
    }
  },

  // Security Configuration
  security: {
    corsOrigin: process.env.CORS_ORIGIN || '*',
    helmetEnabled: process.env.HELMET_ENABLED !== 'false',
    rateLimitEnabled: process.env.RATE_LIMIT_ENABLED !== 'false',
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    morganFormat: process.env.MORGAN_FORMAT || 'combined',
    enableConsoleLogs: process.env.ENABLE_CONSOLE_LOGS !== 'false',
    enableFileLogs: process.env.ENABLE_FILE_LOGS === 'false'
  },

};

// Helper functions
config.isDevelopment = () => config.server.nodeEnv === 'development';
config.isProduction = () => config.server.nodeEnv === 'production';
config.isTest = () => config.server.nodeEnv === 'test';

config.getAwsConfig = () => {
  const awsConfig = {
    region: config.aws.region,
    credentials: {
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey
    }
  };

  // Use LocalStack for local development
  if (config.aws.useLocalStack) {
    awsConfig.endpoint = config.aws.endpoint;
    awsConfig.forcePathStyle = true;
  }

  return awsConfig;
};

config.getSqsQueueUrl = () => {
  // if (config.aws.useLocalStack) {
  //   return `${config.aws.endpoint}/000000000000/${config.sqs.queueName}`;
  // }
  return config.sqs.queueUrl;
};

// Validate required configuration
config.validate = () => {
  const required = [
    'parse.serverUrl',
    'parse.appId',
    'parse.masterKey'
  ];

  const missing = required.filter(key => {
    const value = key.split('.').reduce((obj, k) => obj?.[k], config);
    return !value;
  });

  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`);
  }

  return true;
};

// Export configuration
export default config;
