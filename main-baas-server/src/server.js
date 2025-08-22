const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config/environment');

// Initialize Parse Client (not server)
const Parse = require('parse/node');
Parse.initialize(
  config.parse.appId,
  config.parse.jsKey,
  config.parse.masterKey
);
Parse.serverURL = config.parse.serverUrl;

const insuranceRoutes = require('./routes/insurance');
const healthRoutes = require('./routes/health');

const app = express();

// Middleware
if (config.security.helmetEnabled) {
  app.use(helmet());
}

app.use(cors({
  origin: config.security.corsOrigin
}));

if (config.logging.enableConsoleLogs) {
  app.use(morgan(config.logging.morganFormat));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
if (config.features.enableParseServer) {
  app.use('/api/insurance', insuranceRoutes);
}

if (config.features.enableHealthChecks) {
  app.use('/health', healthRoutes);
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: config.isDevelopment() ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server - Bind to 0.0.0.0 to accept connections from all interfaces
app.listen(config.server.port, '0.0.0.0', () => {
  console.log(`🚀 Main Baas Server running on 0.0.0.0:${config.server.port}`);
  console.log(`📝 Environment: ${config.server.nodeEnv}`);
  console.log(`🔗 Parse Server URL: ${config.parse.serverUrl}`);
  console.log(`☁️ AWS Region: ${config.aws.region}`);
  console.log(`📨 SQS Queue: ${config.sqs.queueName}`);
  console.log(`🌐 Access URLs:`);
  console.log(`   - Local: http://localhost:${config.server.port}`);
  console.log(`   - Network: http://127.0.0.1:${config.server.port}`);
  
  // Validate configuration
  try {
    config.validate();
    console.log('✅ Configuration validated successfully');
  } catch (error) {
    console.error('❌ Configuration validation failed:', error.message);
    process.exit(1);
  }
});

module.exports = app;
