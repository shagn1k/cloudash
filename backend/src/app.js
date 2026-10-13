const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { config: defaultConfig } = require('./config');
const createRoutes = require('./routes');
const { createInfrastructureProvider } = require('./services/infrastructureProvider');
const { createMetricsCollector } = require('./services/metricsCollector');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

/**
 * Builds the Express app without starting it, so tests can create isolated instances
 * (different mode, fake provider, fresh counters) and never open a network port.
 */
function createApp({
  config = defaultConfig,
  provider = createInfrastructureProvider(config),
  collector = createMetricsCollector(),
} = {}) {
  const app = express();

  app.disable('x-powered-by');
  app.use(
    helmet({
      // The ALB serves plain HTTP until a certificate is attached, so HTTPS-only rules would break the page:
      // "upgrade-insecure-requests" makes browsers load assets over https and HSTS pins https.
      contentSecurityPolicy: { useDefaults: true, directives: { 'upgrade-insecure-requests': null } },
      hsts: false,
    }),
  );
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());

  // Count API traffic only (not static files), so the dashboard's numbers describe the API.
  app.use('/api', collector.middleware);
  app.use('/api', createRoutes({ config, provider, collector }));

  // In Docker/AWS the React build is served from the same origin as the API.
  const indexHtml = path.join(config.frontendDist, 'index.html');
  if (fs.existsSync(indexHtml)) {
    app.use(express.static(config.frontendDist, { index: false, maxAge: '1h' }));
    app.get(/^\/(?!api(\/|$)).*/, (req, res) => {
      res.set('Cache-Control', 'no-cache'); // index.html must always be revalidated; assets are hashed
      res.sendFile(indexHtml);
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
