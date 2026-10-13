const express = require('express');
const { getDeployment } = require('../services/statusService');

/** GET /api/deployment - version, environment, deployment status, last deployment. */
function createDeploymentRouter(deps) {
  const router = express.Router();
  router.get('/', (req, res) => {
    res.json(getDeployment(deps));
  });
  return router;
}

module.exports = createDeploymentRouter;
