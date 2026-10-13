const fs = require('fs');
const os = require('os');
const { createAwsClients } = require('./awsClients');
const { createEc2Service } = require('./awsEc2Service');
const { createCloudWatchService } = require('./cloudWatchService');
const { createLoadBalancerService } = require('./loadBalancerService');
const { createEcrService } = require('./ecrService');
const { createTtlCache } = require('./ttlCache');
const { toHttpError } = require('./awsErrors');

const settle = (promise) => promise.then((value) => ({ ok: true, value }), (error) => ({ ok: false, error }));

function measureMemoryPercent() {
  return Number(((1 - os.freemem() / os.totalmem()) * 100).toFixed(1));
}

/**
 * AWS-MODE data source: every infrastructure value comes from the AWS APIs through the AWS SDK.
 * It has the same getInfrastructure() shape as the simulated provider, so routes do not care which one runs.
 *
 * Honesty rules:
 *  - If an AWS call fails, that component is reported as "unavailable" (and listed in `issues`).
 *    A number is NEVER invented to fill the gap.
 *  - The `sources` field says exactly where each value came from.
 *  - Two values do not come from AWS and are labelled as such: memory (measured by the app on
 *    the host, because CloudWatch has no memory metric without an extra agent) and the container
 *    state (inferred from the fact that this very process is running inside a container).
 */
function createAwsProvider(
  config,
  {
    clients = createAwsClients(config.aws),
    isContainer = () => fs.existsSync('/.dockerenv'),
    memoryPercent = measureMemoryPercent,
    logger = console,
  } = {},
) {
  const { aws } = config;
  const ec2 = createEc2Service({ client: clients.ec2, aws });
  const cloudWatch = createCloudWatchService({ client: clients.cloudwatch, aws });
  const loadBalancer = createLoadBalancerService({ client: clients.elbv2, aws });
  const ecr = createEcrService({ client: clients.ecr, aws });

  const cached = createTtlCache();
  const ttl = aws.cacheSeconds * 1000;
  const metricsTtl = Math.max(ttl, 60 * 1000); // CloudWatch calls are billed and its data is 1-5 min granular
  const slowTtl = Math.max(ttl, 60 * 1000);

  /** Runs an AWS call through the cache; failures become safe 502 errors and are logged in full. */
  function call(label, key, ttlMs, loader) {
    return async () => {
      try {
        return await cached(key, ttlMs, loader);
      } catch (error) {
        logger.warn(`[aws] ${label} failed: ${error.name}: ${error.message}`);
        throw toHttpError(label, error);
      }
    };
  }

  const getEc2 = call('EC2', 'ec2', ttl, () => ec2.getInstance());
  const getCpu = call('CloudWatch', 'cw:cpu', metricsTtl, () => cloudWatch.getCpuUtilization());
  const getStatusChecks = call('CloudWatch', 'cw:checks', metricsTtl, () => cloudWatch.getStatusChecks());
  const getAlarms = call('CloudWatch', 'cw:alarms', ttl, () => cloudWatch.getAlarms());
  const getTargetHealth = call('ALB', 'alb:targets', ttl, () => loadBalancer.getTargetHealth());
  const getLoadBalancer = call('ALB', 'alb:lb', slowTtl, () => loadBalancer.getLoadBalancer());
  const getEcr = call('ECR', 'ecr', slowTtl, () => ecr.getRepository());

  return {
    dataSource: 'aws',

    async getInfrastructure() {
      const [ec2R, cpuR, checksR, alarmsR, targetsR, lbR] = await Promise.all(
        [getEc2(), getCpu(), getStatusChecks(), getAlarms(), getTargetHealth(), getLoadBalancer()].map(settle),
      );

      const issues = [...new Set([ec2R, cpuR, checksR, alarmsR, targetsR, lbR].filter((r) => !r.ok).map((r) => r.error.message))];
      const cpu = cpuR.ok ? cpuR.value.value : null;

      return {
        ec2: { state: ec2R.ok ? ec2R.value.state : 'unavailable' },
        container: { state: isContainer() ? 'running' : 'not_containerized' },
        loadBalancer: {
          status: lbR.ok ? lbR.value.state : 'unavailable',
          targetHealth: targetsR.ok ? targetsR.value.summary : 'unavailable',
        },
        monitoring: {
          cloudwatch: alarmsR.ok ? alarmsR.value.overall : 'unavailable',
          cpuUtilization: cpu,
          cpuDatapointTime: cpuR.ok ? cpuR.value.timestamp ?? null : null,
          ec2StatusChecks: checksR.ok ? checksR.value.state : 'unavailable',
        },
        resources: { cpu, memory: memoryPercent() },
        issues,
        sources: {
          ec2: 'AWS EC2 DescribeInstances',
          cpu: 'AWS CloudWatch GetMetricStatistics (AWS/EC2 CPUUtilization, 5-minute average)',
          ec2StatusChecks: 'AWS CloudWatch GetMetricStatistics (AWS/EC2 StatusCheckFailed)',
          cloudwatch: 'AWS CloudWatch DescribeAlarms',
          loadBalancer: 'AWS ELBv2 DescribeLoadBalancers / DescribeTargetHealth',
          memory: 'Measured by the application on the host OS (not from AWS)',
          container: 'Inferred: this process is running inside a container (not from AWS)',
        },
      };
    },

    // Detail endpoints (/api/aws/*). These throw safe 502 errors if AWS fails.
    getEc2Details: () => getEc2(),
    async getCloudWatchDetails() {
      const [cpu, statusChecks, alarms] = await Promise.all([getCpu(), getStatusChecks(), getAlarms()]);
      return { cpuUtilization: cpu, statusChecks, alarms };
    },
    async getLoadBalancerDetails() {
      const [balancer, targets] = await Promise.all([getLoadBalancer(), getTargetHealth()]);
      return { loadBalancer: balancer, targetHealth: targets };
    },
    getEcrDetails: () => getEcr(),
  };
}

module.exports = { createAwsProvider };
