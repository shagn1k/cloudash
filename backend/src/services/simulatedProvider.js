/**
 * DEVELOPMENT-MODE data source. Every value here is SIMULATED so the dashboard can be built and
 * tested without an AWS account. It is never used when APP_MODE=aws.
 *
 * All providers expose the same method, getInfrastructure(), so the routes do not care which one runs.
 * The AWS provider (Phase 8) will return the same shape using real AWS SDK calls.
 */

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function createSimulatedProvider({ random = Math.random } = {}) {
  // CPU and memory drift a little on every call (a "random walk") so the dashboard looks alive,
  // while staying inside believable ranges.
  let cpu = 18;
  let memory = 42;

  return {
    dataSource: 'simulated',

    async getInfrastructure() {
      cpu = clamp(cpu + (random() - 0.5) * 6, 3, 85);
      memory = clamp(memory + (random() - 0.5) * 2, 30, 80);

      return {
        ec2: { state: 'running' },
        container: { state: 'running' },
        loadBalancer: { status: 'active', targetHealth: 'healthy' },
        monitoring: {
          cloudwatch: 'ok',
          cpuUtilization: Number(cpu.toFixed(1)),
          ec2StatusChecks: 'passed',
        },
        resources: {
          cpu: Number(cpu.toFixed(1)),
          memory: Number(memory.toFixed(1)),
        },
        issues: [],
        sources: { all: 'Simulated for local development (APP_MODE=development). Not from AWS.' },
      };
    },
  };
}

module.exports = { createSimulatedProvider };
