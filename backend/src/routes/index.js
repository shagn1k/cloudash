const express = require('express');
const createHealthRouter = require('./health');
const createStatusRouter = require('./status');
const createMetricsRouter = require('./metrics');
const createDeploymentRouter = require('./deployment');
const createAwsRouter = require('./aws');

/** Mounts every /api route. `deps` = { config, provider, collector }. */
function createRoutes(deps) {
  const router = express.Router();

  // These responses change constantly; never let a browser or proxy serve a stale copy.
  router.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  router.use('/health', createHealthRouter(deps));
  router.use('/status', createStatusRouter(deps));
  router.use('/metrics', createMetricsRouter(deps));
  router.use('/deployment', createDeploymentRouter(deps));
  router.use('/aws', createAwsRouter(deps));

  return router;
}

module.exports = createRoutes;
