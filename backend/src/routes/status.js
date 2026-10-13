const express = require('express');
const { getStatus } = require('../services/statusService');

/** GET /api/status - overall application + infrastructure status. */
function createStatusRouter(deps) {
  const router = express.Router();
  router.get('/', async (req, res) => {
    res.json(await getStatus(deps));
  });
  return router;
}

module.exports = createStatusRouter;
