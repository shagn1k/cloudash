const request = require('supertest');
const { devApp, awsApp } = require('./helpers');

describe('GET /api/health', () => {
  it('returns 200 with predictable JSON', async () => {
    const res = await request(devApp()).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toEqual({
      status: 'healthy',
      service: 'cloudopshub-api',
      timestamp: expect.any(String),
    });
  });

  it('never depends on the infrastructure provider (stays healthy even if AWS calls fail)', async () => {
    const brokenProvider = {
      dataSource: 'aws',
      getInfrastructure: async () => {
        throw new Error('AWS is down');
      },
    };
    const res = await request(devApp({ provider: brokenProvider })).get('/api/health');

    expect(res.status).toBe(200);
  });

  it('is healthy in AWS mode too, even though AWS data is not implemented yet', async () => {
    const res = await request(awsApp()).get('/api/health');

    expect(res.status).toBe(200);
  });

  it('is never cached', async () => {
    const res = await request(devApp()).get('/api/health');

    expect(res.headers['cache-control']).toBe('no-store');
  });
});
