// Parse Server configuration
import path from 'path';
import config from './environment.js';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const parseConfig = {
  databaseURI: config.mongodb.uri,
     
  cloud: path.resolve(__dirname, '../cloud/main.js'),
  
  appId: config.parse.appId,
  masterKey: config.parse.masterKey,
  serverURL: config.parse.serverUrl,
  publicServerURL: config.parse.publicServerUrl,
  
  // Security settings
  allowClientClassCreation: false,
  allowCustomObjectId: false,
  enableAnonymousUsers: false,
  
 
  
  // Logging - use environment configuration
  verbose: config.isDevelopment(),
  logLevel: config.logging.level,
  
};

// Validate configuration before exporting
try {
  config.validate();
} catch (error) {
  console.error('Parse Server configuration validation failed:', error.message);
  process.exit(1);
}

export default parseConfig;