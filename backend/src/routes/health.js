const express = require('express');

/**
 * GET /api/health
 * Deliberately tiny: no AWS calls, no database, no external dependencies.
 * Docker, the ALB, CI/CD and the Python script all rely on it staying fast and predictable.
 */
function createHealthRouter({ config }) {
  const router = express.Router();

  router.get('/', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      service: config.serviceName,
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}

module.exports = createHealthRouter;
