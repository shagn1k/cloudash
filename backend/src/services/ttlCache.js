/**
 * Tiny in-memory cache with a time-to-live.
 *
 * Why: the dashboard refreshes every few seconds, but AWS data changes slowly and every AWS API call
 * is rate-limited (and CloudWatch calls are billed). Caching for ~15-60 seconds keeps the dashboard
 * responsive and cheap. Simultaneous requests for the same key share ONE in-flight AWS call.
 * Failures are never cached, so a recovered resource shows up on the next refresh.
 */
function createTtlCache({ now = Date.now } = {}) {
  const entries = new Map();

  return async function cached(key, ttlMs, loader) {
    const hit = entries.get(key);
    if (hit && hit.expiresAt > now()) return hit.promise;

    const promise = loader();
    const entry = { promise, expiresAt: Infinity }; // Infinity = still loading, share the promise
    entries.set(key, entry);

    try {
      const value = await promise;
      entry.expiresAt = now() + ttlMs;
      return value;
    } catch (error) {
      if (entries.get(key) === entry) entries.delete(key);
      throw error;
    }
  };
}

module.exports = { createTtlCache };
