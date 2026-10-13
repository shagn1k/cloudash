const express = require('express');
const { HttpError } = require('../middleware/errorHandler');
const { checkApplicationHealth } = require('../services/healthService');

/**
 * /api/aws/* : one endpoint per AWS service, for inspection and troubleshooting.
 *   GET /api/aws/ec2         instance state
 *   GET /api/aws/cloudwatch  CPU, status checks, alarms
 *   GET /api/aws/alb         load balancer + target health
 *   GET /api/aws/ecr         repository + latest image
 *   GET /api/aws/health      real call to /api/health + which AWS integrations answer
 *
 * They only work in AWS mode; in development mode data is simulated, so serving it under an
 * "aws" URL would be misleading.
 */
function createAwsRouter({ config, provider }) {
  const router = express.Router();

  router.use((req, res, next) => {
    if (config.appMode !== 'aws') {
      return next(
        new HttpError(409, 'AWS endpoints require APP_MODE=aws. In development mode infrastructure data is simulated.'),
      );
    }
    return next();
  });

  const respond = (load) => async (req, res) => {
    res.json({ dataSource: 'aws', region: config.aws.region, ...(await load()), timestamp: new Date().toISOString() });
  };

  router.get('/ec2', respond(async () => ({ ec2: await provider.getEc2Details() })));
  router.get('/cloudwatch', respond(() => provider.getCloudWatchDetails()));
  router.get('/alb', respond(() => provider.getLoadBalancerDetails()));
  router.get('/ecr', respond(async () => ({ ecr: await provider.getEcrDetails() })));

  router.get('/health', async (req, res) => {
    const probes = {
      ec2: provider.getEc2Details,
      cloudwatch: provider.getCloudWatchDetails,
      alb: provider.getLoadBalancerDetails,
      ecr: provider.getEcrDetails,
    };

    const [application, ...results] = await Promise.all([
      checkApplicationHealth({ port: config.port }),
      ...Object.values(probes).map((probe) => probe().then(() => 'ok', (error) => ({ error: error.message }))),
    ]);

    const integrations = Object.fromEntries(Object.keys(probes).map((name, index) => [name, results[index]]));
    const allOk = Object.values(integrations).every((result) => result === 'ok');

    res.json({
      dataSource: 'aws',
      region: config.aws.region,
      application,
      integrations,
      overall: application.status === 'healthy' && allOk ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}

module.exports = createAwsRouter;
