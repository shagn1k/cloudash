const request = require('supertest');
const { createMetricsCollector } = require('../src/services/metricsCollector');
const { createSimulatedProvider } = require('../src/services/simulatedProvider');
const { devApp, awsApp } = require('./helpers');

describe('GET /api/metrics', () => {
  it('returns cpu, memory, requests, errors, responseTime and uptime', async () => {
    const res = await request(devApp()).get('/api/metrics');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      dataSource: 'simulated',
      cpu: expect.any(Number),
      memory: expect.any(Number),
      requests: expect.any(Number),
      errors: expect.any(Number),
      errorRate: expect.any(Number),
      responseTime: expect.any(Number),
      uptime: expect.any(Number),
    });
    expect(res.body.cpu).toBeGreaterThanOrEqual(0);
    expect(res.body.cpu).toBeLessThanOrEqual(100);
    expect(res.body.memory).toBeLessThanOrEqual(100);
  });

  it('counts the application\'s own requests', async () => {
    const app = devApp();
    await request(app).get('/api/health');
    await request(app).get('/api/health');
    await request(app).get('/api/health');
    const res = await request(app).get('/api/metrics');

    expect(res.body.requests).toBeGreaterThanOrEqual(3);
    expect(res.body.errors).toBe(0);
    expect(res.body.measuredByApp).toContain('requests');
  });

  it('counts server errors (5xx) in the error rate', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const provider = {
      dataSource: 'simulated',
      getInfrastructure: jest
        .fn()
        .mockRejectedValueOnce(new Error('boom'))
        .mockResolvedValue({ resources: { cpu: 1, memory: 1 } }),
    };
    const app = devApp({ provider });

    await request(app).get('/api/metrics'); // fails -> 500
    const res = await request(app).get('/api/metrics');

    expect(res.body.errors).toBe(1);
    expect(res.body.errorRate).toBeGreaterThan(0);
    consoleError.mockRestore();
  });

});

describe('metrics collector', () => {
  it('computes error rate and average response time', () => {
    const collector = createMetricsCollector({ uptime: () => 125.9 });
    collector.record(200, 10);
    collector.record(200, 30);
    collector.record(404, 20);
    collector.record(500, 40);

    expect(collector.snapshot()).toEqual({
      requests: 4,
      errors: 1, // 404 is a client error, only 5xx count
      errorRate: 25,
      responseTime: 25,
      uptime: 125,
    });
  });

  it('reports zeros before any request (no divide-by-zero)', () => {
    const snapshot = createMetricsCollector().snapshot();

    expect(snapshot).toMatchObject({ requests: 0, errors: 0, errorRate: 0, responseTime: 0 });
  });

  it('only averages the most recent window of requests', () => {
    const collector = createMetricsCollector({ windowSize: 2 });
    collector.record(200, 1000);
    collector.record(200, 10);
    collector.record(200, 20);

    expect(collector.snapshot().responseTime).toBe(15);
  });
});

describe('simulated provider', () => {
  it('keeps CPU and memory inside believable bounds', async () => {
    const high = createSimulatedProvider({ random: () => 1 });
    const low = createSimulatedProvider({ random: () => 0 });
    let highest;
    let lowest;
    for (let i = 0; i < 200; i += 1) {
      highest = await high.getInfrastructure();
      lowest = await low.getInfrastructure();
    }

    expect(highest.resources.cpu).toBeLessThanOrEqual(85);
    expect(highest.resources.memory).toBeLessThanOrEqual(80);
    expect(lowest.resources.cpu).toBeGreaterThanOrEqual(3);
    expect(lowest.resources.memory).toBeGreaterThanOrEqual(30);
  });
});
