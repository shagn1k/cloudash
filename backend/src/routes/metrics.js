const express = require('express');
const { getMetrics } = require('../services/statusService');

/** GET /api/metrics - CPU, memory, requests, errors, response time, uptime. */
function createMetricsRouter(deps) {
  const router = express.Router();
  router.get('/', async (req, res) => {
    res.json(await getMetrics(deps));
  });
  return router;
}

module.exports = createMetricsRouter;
