/**
 * API service layer: the ONLY place in the frontend that knows how to talk to the backend.
 * Components never call fetch() directly, and nothing here ever touches AWS.
 *
 * Response contracts (implemented by the backend in Phase 2):
 *   GET /api/health     -> { status, service, timestamp }                        (available now)
 *   GET /api/status     -> { mode, dataSource, application, infrastructure, loadBalancer, monitoring }
 *   GET /api/metrics    -> { dataSource, cpu, memory, requests, errors, errorRate, responseTime, uptime }
 *   GET /api/deployment -> { version, environment, status, lastDeployment, imageVersion }
 */

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request(path, { signal } = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { signal, headers: { Accept: 'application/json' } });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError(`Cannot reach the API at ${API_URL}. Is the backend running?`);
  }

  let body = null;
  try {
    body = await response.json();
  } catch {
    // Non-JSON body: fall through to the generic message below.
  }

  if (!response.ok) {
    const message = body?.error?.message || `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status);
  }
  return body;
}

export const api = {
  async getHealth(options) {
    const health = await request('/api/health', options);
    // The moment the check succeeded, measured in the browser.
    return { ...health, checkedAt: new Date().toISOString() };
  },
  getStatus: (options) => request('/api/status', options),
  getMetrics: (options) => request('/api/metrics', options),
  getDeployment: (options) => request('/api/deployment', options),
};

export { API_URL };
