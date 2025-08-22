const express = require('express');
const ParseServer = require('parse-server').ParseServer;
const parseConfig = require('./parse-config');

// Create Express app
const app = express();

// Initialize Parse Server
const api = new ParseServer(parseConfig);

// Mount Parse Server on the app
app.use('/parse', api);

// Start the server
const port = process.env.PARSE_PORT || 1337;
const server = app.listen(port, () => {
  console.log(`🚀 Parse Server running on port ${port}`);
  console.log(`📊 Dashboard: http://localhost:${port}/parse`);
  console.log(`🔗 Server URL: ${parseConfig.serverURL}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = { app, api };
