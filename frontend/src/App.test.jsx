import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

const jsonResponse = (body, status = 200) =>
  Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) });

const CONTRACT = {
  '/api/health': { status: 'healthy', service: 'cloudopshub-api', timestamp: '2026-01-01T00:00:00Z' },
  '/api/status': {
    mode: 'development',
    dataSource: 'simulated',
    infrastructure: { ec2: { state: 'running' }, container: { state: 'running' } },
    loadBalancer: { status: 'active', targetHealth: 'healthy' },
    monitoring: { cloudwatch: 'ok', cpuUtilization: 12.5, ec2StatusChecks: 'passed' },
  },
  '/api/metrics': { cpu: 12.5, memory: 40.2, requests: 1200, errorRate: 0.5, responseTime: 85, uptime: 3700 },
  '/api/deployment': {
    version: 'v1.0.0',
    environment: 'production',
    status: 'success',
    lastDeployment: '2026-01-01T00:00:00Z',
    imageVersion: 'v1.0.0',
  },
};

function mockFetch(routes) {
  vi.stubGlobal(
    'fetch',
    vi.fn((url) => {
      const path = new URL(url).pathname;
      return routes[path] ? routes[path]() : jsonResponse({ error: { message: 'Route not found' } }, 404);
    }),
  );
}

const panel = (name) => within(screen.getByRole('region', { name }));

describe('Dashboard', () => {
  beforeEach(() => vi.useRealTimers());
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('renders values returned by the API and labels simulated data', async () => {
    mockFetch(Object.fromEntries(Object.entries(CONTRACT).map(([p, b]) => [p, () => jsonResponse(b)])));
    render(<App />);

    await waitFor(() => expect(panel('Application Status').getByText('ONLINE')).toBeInTheDocument());
    await waitFor(() => expect(panel('Deployment').getAllByText('v1.0.0')).toHaveLength(2)); // version + image
    expect(screen.getByText('DEVELOPMENT · SIMULATED DATA')).toBeInTheDocument();
    expect(panel('Infrastructure Status').getAllByText('RUNNING')).toHaveLength(2); // EC2 + container
    expect(panel('Infrastructure Status').getByText('1,200')).toBeInTheDocument();
    expect(panel('Load Balancer').getByText('HEALTHY')).toBeInTheDocument();
  });

  it('shows an error state only in panels whose endpoint fails', async () => {
    mockFetch({ '/api/health': () => jsonResponse(CONTRACT['/api/health']) });
    render(<App />);

    await waitFor(() => expect(panel('Application Status').getByText('ONLINE')).toBeInTheDocument());
    await waitFor(() => expect(panel('Deployment').getByText('Unavailable')).toBeInTheDocument());
    expect(panel('Load Balancer').getByText('Route not found')).toBeInTheDocument();
    expect(screen.getByText('DATA SOURCE UNKNOWN')).toBeInTheDocument();
  });

  it('shows OFFLINE with a helpful message when the backend is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))));
    render(<App />);

    await waitFor(() => expect(panel('Application Status').getByText(/Cannot reach the API/)).toBeInTheDocument());
  });
});
