const Parse = require('parse/node');
const config = require('../config/environment');

// Initialize Parse
Parse.initialize(config.parse.appId, config.parse.jsKey, config.parse.masterKey);
Parse.serverURL = config.parse.serverUrl;

// Define insurance types and their corresponding table names
const INSURANCE_TYPES = {
  motor: 'MotorAPILogs',
  travel: 'TravelAPILogs'
};

// Function to create schema for API log tables
async function createAPILogSchema(className) {
  const schema = new Parse.Schema(className);
  
  // Check if class already exists
  try {
    await schema.get();
    console.log(`✅ Schema for ${className} already exists`);
    return;
  } catch (error) {
    // Class doesn't exist, create it
  }

  // Define fields for API log tables
  schema
    .addString('userId', { required: true })
    .addString('requestId', { required: true })
    .addString('endpoint', { required: true })
    .addString('step', { required: true })
    .addString('method', { defaultValue: 'POST' })
    .addString('status', { defaultValue: 'pending' }) // pending, success, error
    .addObject('request')
    .addObject('response')
    .addObject('headers')
    .addObject('metadata')
    .addNumber('responseTime') // in milliseconds
    .addString('ipAddress')
    .addString('userAgent')
    .addDate('timestamp', { required: true });

  try {
    await schema.save();
    console.log(`✅ Created schema for ${className}`);
  } catch (error) {
    console.error(`❌ Error creating schema for ${className}:`, error.message);
    throw error;
  }
}


// Main migration function
async function runMigration() {
  console.log('🗄️  Starting Parse Server table migration...\n');
  
  try {
    // Validate configuration
    config.validate();
    
    // Create schemas for each insurance type
    for (const [insuranceType, className] of Object.entries(INSURANCE_TYPES)) {
      console.log(`📋 Creating table for ${insuranceType} insurance type: ${className}`);
      await createAPILogSchema(className);
    }
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - Tables created: ${Object.values(INSURANCE_TYPES).join(', ')}`);
    console.log(`   - Insurance types: ${Object.keys(INSURANCE_TYPES).join(', ')}`);
    console.log(`   - Environment: ${config.server.nodeEnv}\n`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('✅ Migration process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration process failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runMigration,
  INSURANCE_TYPES
};