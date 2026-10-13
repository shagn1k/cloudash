require('dotenv').config({ quiet: true });

const path = require('path');
const packageJson = require('../package.json');

const VALID_MODES = ['development', 'aws'];

/**
 * Builds the configuration from an environment object (process.env by default).
 * Taking `env` as a parameter lets tests build a config for either mode without touching process.env.
 *
 * APP_MODE controls where infrastructure data comes from:
 *   development -> simulated values (no AWS needed, safe for local work)
 *   aws         -> real values retrieved through the AWS SDK
 */
function loadConfig(env = process.env) {
  const appMode = (env.APP_MODE || 'development').toLowerCase();

  if (!VALID_MODES.includes(appMode)) {
    throw new Error(`Invalid APP_MODE "${appMode}". Use one of: ${VALID_MODES.join(', ')}`);
  }

  const isAws = appMode === 'aws';
  const startedAt = new Date().toISOString();

  return {
    serviceName: 'cloudopshub-api',
    // 5001, not 5000: macOS reserves 5000 for AirPlay Receiver, which silently hijacks localhost:5000.
    port: Number.parseInt(env.PORT, 10) || 5001,
    appMode,
    // Browsers only allow the React dev server to call this API if its origin is listed here.
    corsOrigin: env.CORS_ORIGIN || 'http://localhost:5173',
    // In Docker/AWS the built React app is served by Express from this folder (same origin as the API).
    frontendDist: env.FRONTEND_DIST || path.resolve(__dirname, '../../frontend/dist'),

    // Which AWS resources to monitor. There are no credentials here on purpose:
    // the AWS SDK finds them itself (EC2 instance role in AWS, `aws configure`/SSO locally).
    aws: {
      region: env.AWS_REGION || env.AWS_DEFAULT_REGION || 'ap-south-1',
      instanceId: env.AWS_EC2_INSTANCE_ID || null,
      targetGroupArn: env.AWS_ALB_TARGET_GROUP_ARN || null,
      ecrRepositoryName: env.AWS_ECR_REPOSITORY_NAME || null,
      // CloudWatch alarms whose names start with this prefix are included in the CloudWatch status.
      alarmPrefix: env.AWS_ALARM_NAME_PREFIX || 'cloudopshub',
      // AWS answers are cached briefly so a dashboard polling every few seconds cannot hit API rate limits.
      cacheSeconds: Number.parseInt(env.AWS_CACHE_SECONDS, 10) || 15,
    },

    // Deployment metadata. In AWS mode the CI/CD pipeline injects these when it starts the container,
    // so there are no invented defaults: anything not provided is reported as "unknown".
    deployment: {
      version: env.APP_VERSION || packageJson.version,
      environment: env.APP_ENVIRONMENT || (isAws ? 'production' : 'development'),
      status: env.DEPLOYMENT_STATUS || (isAws ? 'unknown' : 'success'),
      lastDeployment: env.DEPLOYED_AT || (isAws ? null : startedAt),
      imageVersion: env.IMAGE_VERSION || (isAws ? 'unknown' : `cloudopshub:${packageJson.version}-local`),
    },
  };
}

module.exports = { loadConfig, config: loadConfig() };
