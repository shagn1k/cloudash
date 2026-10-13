/**
 * Measures the API's own traffic. These numbers are REAL in every mode because the app
 * counts them itself; nothing about them is simulated.
 *
 *  - requests / errors: totals since the process started (errors = HTTP 5xx server errors)
 *  - responseTime: average over the most recent `windowSize` requests, in milliseconds
 *  - uptime: seconds since the process started
 */
function createMetricsCollector({ windowSize = 200, uptime = () => process.uptime() } = {}) {
  let requests = 0;
  let errors = 0;
  const recentDurations = [];

  function record(statusCode, durationMs) {
    requests += 1;
    if (statusCode >= 500) errors += 1;

    recentDurations.push(durationMs);
    if (recentDurations.length > windowSize) recentDurations.shift();
  }

  function middleware(req, res, next) {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
      record(res.statusCode, durationMs);
    });
    next();
  }

  function snapshot() {
    const averageMs = recentDurations.length
      ? recentDurations.reduce((sum, value) => sum + value, 0) / recentDurations.length
      : 0;

    return {
      requests,
      errors,
      errorRate: requests ? Number(((errors / requests) * 100).toFixed(2)) : 0,
      responseTime: Number(averageMs.toFixed(1)),
      uptime: Math.floor(uptime()),
    };
  }

  return { middleware, snapshot, record };
}

module.exports = { createMetricsCollector };
