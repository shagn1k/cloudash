/**
 * Calls the application's OWN /api/health endpoint over real HTTP and measures it.
 * This is the same check the Docker health check, the ALB and the Python script rely on,
 * so it shows what they would see.
 */
async function checkApplicationHealth({ port, fetchImpl = fetch, timeoutMs = 2000 }) {
  const url = `http://127.0.0.1:${port}/api/health`;
  const started = process.hrtime.bigint();

  try {
    const response = await fetchImpl(url, { signal: AbortSignal.timeout(timeoutMs) });
    const responseTimeMs = Number((Number(process.hrtime.bigint() - started) / 1e6).toFixed(1));
    const body = await response.json().catch(() => null);

    return {
      status: response.ok && body?.status === 'healthy' ? 'healthy' : 'unhealthy',
      httpStatus: response.status,
      responseTimeMs,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      httpStatus: null,
      responseTimeMs: null,
      error: error.name === 'TimeoutError' ? `No answer within ${timeoutMs} ms` : 'Request failed',
    };
  }
}

module.exports = { checkApplicationHealth };
