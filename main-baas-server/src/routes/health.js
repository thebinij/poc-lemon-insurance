const express = require('express');
const router = express.Router();

/**
 * @route GET /health
 * @desc Health check endpoint
 */
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'auth-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * @route GET /health/ready
 * @desc Readiness check endpoint
 */
router.get('/ready', (req, res) => {
  // Add any readiness checks here (database, external services, etc.)
  res.json({
    status: 'ready',
    service: 'auth-service',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
