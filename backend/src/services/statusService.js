/** Builds the payloads for /api/status, /api/metrics and /api/deployment. Pure logic, no HTTP. */

function isOperational(infra) {
  return (
    infra.ec2.state === 'running' &&
    infra.container.state === 'running' &&
    infra.loadBalancer.targetHealth === 'healthy' &&
    infra.monitoring.cloudwatch === 'ok' &&
    infra.monitoring.ec2StatusChecks === 'passed'
  );
}

async function getStatus({ config, provider }) {
  const infra = await provider.getInfrastructure();

  return {
    mode: config.appMode,
    dataSource: provider.dataSource,
    overall: isOperational(infra) ? 'operational' : 'degraded',
    // If this code is running and answering, the application, API and server are up.
    application: { status: 'online', api: 'healthy', server: 'running' },
    infrastructure: { ec2: infra.ec2, container: infra.container },
    loadBalancer: infra.loadBalancer,
    monitoring: infra.monitoring,
    // Problems talking to AWS (safe messages only) and exactly where each value came from.
    issues: infra.issues || [],
    sources: infra.sources || {},
    timestamp: new Date().toISOString(),
  };
}

async function getMetrics({ provider, collector }) {
  const infra = await provider.getInfrastructure();
  const traffic = collector.snapshot();

  return {
    dataSource: provider.dataSource,
    cpu: infra.resources.cpu,
    memory: infra.resources.memory,
    requests: traffic.requests,
    errors: traffic.errors,
    errorRate: traffic.errorRate,
    responseTime: traffic.responseTime,
    uptime: traffic.uptime,
    // Which fields the application measured itself (real in every mode).
    measuredByApp: ['requests', 'errors', 'errorRate', 'responseTime', 'uptime'],
    timestamp: new Date().toISOString(),
  };
}

function getDeployment({ config }) {
  return {
    ...config.deployment,
    // In development these are local defaults; in AWS mode they are injected by the CI/CD pipeline.
    dataSource: config.appMode === 'aws' ? 'configuration' : 'simulated',
  };
}

module.exports = { getStatus, getMetrics, getDeployment };
