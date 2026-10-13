const request = require('supertest');
const { loadConfig } = require('../src/config');
const { devApp, awsApp } = require('./helpers');

describe('GET /api/deployment', () => {
  it('returns local defaults in development mode', async () => {
    const res = await request(devApp()).get('/api/deployment');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      version: expect.stringMatching(/^\d+\.\d+\.\d+/),
      environment: 'development',
      status: 'success',
      lastDeployment: expect.any(String),
      imageVersion: expect.stringContaining('local'),
      dataSource: 'simulated',
    });
  });

  it('reports what the CI/CD pipeline injected in AWS mode', async () => {
    const res = await request(
      awsApp({
        APP_VERSION: 'v1.2.3',
        DEPLOYMENT_STATUS: 'success',
        DEPLOYED_AT: '2026-01-01T00:00:00Z',
        IMAGE_VERSION: '123456789012.dkr.ecr.eu-west-1.amazonaws.com/cloudopshub:abc1234',
      }),
    ).get('/api/deployment');

    expect(res.body).toEqual({
      version: 'v1.2.3',
      environment: 'production',
      status: 'success',
      lastDeployment: '2026-01-01T00:00:00Z',
      imageVersion: '123456789012.dkr.ecr.eu-west-1.amazonaws.com/cloudopshub:abc1234',
      dataSource: 'configuration',
    });
  });

  it('says "unknown" in AWS mode when nothing was injected, instead of inventing a deployment', async () => {
    const res = await request(awsApp()).get('/api/deployment');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('unknown');
    expect(res.body.lastDeployment).toBeNull();
    expect(res.body.imageVersion).toBe('unknown');
  });
});

describe('configuration', () => {
  it('defaults to development mode on port 5001', () => {
    const config = loadConfig({});

    expect(config.appMode).toBe('development');
    expect(config.port).toBe(5001);
  });

  it('rejects an unknown APP_MODE', () => {
    expect(() => loadConfig({ APP_MODE: 'staging' })).toThrow(/Invalid APP_MODE/);
  });

  it('accepts APP_MODE case-insensitively', () => {
    expect(loadConfig({ APP_MODE: 'AWS' }).appMode).toBe('aws');
  });
});
