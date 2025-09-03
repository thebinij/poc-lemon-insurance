import express from 'express';
const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Insurance API health check successful',
    data: {
      status: 'healthy',
      supportedTypes: ['travel', 'motor'],
      timestamp: new Date().toISOString()
    }
  });
});

export default router;
