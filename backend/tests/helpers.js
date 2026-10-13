const { loadConfig } = require('../src/config');
const { createApp } = require('../src/app');

/** A provider whose infrastructure data the test controls. */
function fakeProvider(overrides = {}) {
  const infra = {
    ec2: { state: 'running' },
    container: { state: 'running' },
    loadBalancer: { status: 'active', targetHealth: 'healthy' },
    monitoring: { cloudwatch: 'ok', cpuUtilization: 10, ec2StatusChecks: 'passed' },
    resources: { cpu: 10, memory: 50 },
    ...overrides,
  };
  return { dataSource: 'simulated', getInfrastructure: async () => infra };
}

const devApp = (options = {}) => createApp({ config: loadConfig({}), ...options });
const awsApp = (env = {}, options = {}) => createApp({ config: loadConfig({ APP_MODE: 'aws', ...env }), ...options });

module.exports = { fakeProvider, devApp, awsApp };
