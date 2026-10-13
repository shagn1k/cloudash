const request = require('supertest');
const { devApp, awsApp, fakeProvider } = require('./helpers');

describe('GET /api/status', () => {
  it('returns application and infrastructure status in development mode', async () => {
    const res = await request(devApp()).get('/api/status');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      mode: 'development',
      dataSource: 'simulated',
      overall: 'operational',
      application: { status: 'online', api: 'healthy', server: 'running' },
      infrastructure: { ec2: { state: 'running' }, container: { state: 'running' } },
      loadBalancer: { status: 'active', targetHealth: 'healthy' },
      monitoring: { cloudwatch: 'ok', ec2StatusChecks: 'passed' },
    });
    expect(typeof res.body.monitoring.cpuUtilization).toBe('number');
  });

  it('reports "degraded" when a component is unhealthy', async () => {
    const provider = fakeProvider({
      ec2: { state: 'stopped' },
      loadBalancer: { status: 'active', targetHealth: 'unhealthy' },
    });
    const res = await request(devApp({ provider })).get('/api/status');

    expect(res.status).toBe(200);
    expect(res.body.overall).toBe('degraded');
    expect(res.body.infrastructure.ec2.state).toBe('stopped');
    expect(res.body.loadBalancer.targetHealth).toBe('unhealthy');
  });

});
