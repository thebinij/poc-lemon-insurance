import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import config from './config/environment.js';
import parseConfig from './config/parseConfig.js';
import { ParseServer } from 'parse-server';

// Import routes and middleware
import insuranceRoutes from './routes/insurance.js';
import healthRoutes from './routes/health.js';
import errorHandler from './middlewares/errorHandler.js';

const app = express();

// CORS configuration
app.use(cors({
  origin: config.security.corsOrigin
}));

// Logging middleware
if (config.logging.enableConsoleLogs) {
  app.use(morgan(config.logging.morganFormat));
}

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Parse Server with cloud code
const parseApi = new ParseServer(parseConfig);

// Start the server
async function startServer() {
  // Start Parse Server and wait for it to be ready
  await parseApi.start();
  
  // Mount Parse Server on the app
  app.use('/parse', parseApi.app);
  
  // Mount routes after Parse Server is ready
  app.use('/api', healthRoutes);
  app.use('/api/insurance', insuranceRoutes);
  
  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({ 
      success: false,
      error: 'Route not found',
      path: req.originalUrl 
    });
  });
  
  // Global error handler (last in chain)
  app.use(errorHandler);
  
  const port = config.server.port;
  const server = app.listen(port, config.server.host, () => {
    console.log('='.repeat(60));
    console.log('🚀 Main BaaS Server with Parse Server Cloud Code');
    console.log('='.repeat(60));
    console.log(`📝 Environment: ${config.server.nodeEnv}`);
    console.log(`🌐 Server: http://${config.server.host}:${port}`);
    console.log(`🔗 Parse Server: ${config.parse.serverUrl}`);
    console.log(`📊 Parse Dashboard: ${config.parse.publicServerUrl}`);
    console.log(`☁️ Cloud Code: ${parseConfig.cloud ? 'Enabled' : 'Disabled'}`);
    console.log(`🔒 Security: Service-based access control enabled`);
    console.log(`📨 SQS Queue: ${config.sqs.queueName}`);
    console.log(`🗄️ MongoDB: ${config.mongodb.uri}`);
    console.log('='.repeat(60));
    
    // Validate configuration
    try {
      config.validate();
      console.log('Configuration validated successfully');
    } catch (error) {
      console.error('Configuration validation failed:', error.message);
      process.exit(1);
    }
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('Process terminated');
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
      console.log('Process terminated');
    });
  });
}

// Start the server
startServer().catch(console.error);

export { app };
