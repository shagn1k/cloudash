const request = require('supertest');
const { devApp } = require('./helpers');

describe('error handling', () => {
  it('returns a JSON 404 for unknown routes', async () => {
    const res = await request(devApp()).get('/api/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: { status: 404, message: 'Route not found: GET /api/does-not-exist' },
    });
  });

  it('returns a JSON 400 for malformed JSON bodies', async () => {
    const res = await request(devApp())
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{bad json');

    expect(res.status).toBe(400);
    expect(res.body.error.status).toBe(400);
  });

  it('hides internal details when an unexpected error occurs (500)', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const provider = {
      dataSource: 'simulated',
      getInfrastructure: async () => {
        throw new Error('secret internal detail: db password');
      },
    };
    const res = await request(devApp({ provider })).get('/api/status');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: { status: 500, message: 'Internal server error' } });
    expect(JSON.stringify(res.body)).not.toMatch(/secret/);
    expect(consoleError).toHaveBeenCalled(); // the real error is still logged server-side
    consoleError.mockRestore();
  });

  it('does not advertise the framework', async () => {
    const res = await request(devApp()).get('/api/health');

    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('only ever grants CORS access to the configured frontend origin', async () => {
    const app = devApp();
    const allowed = await request(app).get('/api/health').set('Origin', 'http://localhost:5173');
    const other = await request(app).get('/api/health').set('Origin', 'http://evil.example');

    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    // The server always names the configured origin; a browser on evil.example sees the mismatch and blocks it.
    expect(other.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(other.headers['access-control-allow-origin']).not.toBe('http://evil.example');
  });
});
