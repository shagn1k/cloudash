/** Maps status words from the backend/AWS to a colour tone used by the UI. */

const OK = new Set([
  'ONLINE', 'HEALTHY', 'RUNNING', 'OK', 'SUCCESS', 'PASSED', 'ACTIVE', 'AVAILABLE',
]);
const WARN = new Set([
  'PENDING', 'INITIAL', 'STOPPING', 'DRAINING', 'IN_PROGRESS', 'UNUSED', 'INSUFFICIENT_DATA', 'DEGRADED',
]);
const BAD = new Set([
  'OFFLINE', 'UNHEALTHY', 'STOPPED', 'TERMINATED', 'SHUTTING-DOWN', 'FAILED', 'ALARM', 'IMPAIRED',
  'UNAVAILABLE', 'ERROR', 'EXITED',
]);

export function toneFor(value) {
  const key = String(value ?? '').trim().toUpperCase().replace(/\s+/g, '_');
  if (OK.has(key)) return 'ok';
  if (WARN.has(key)) return 'warn';
  if (BAD.has(key)) return 'bad';
  return 'neutral';
}

export function formatUptime(totalSeconds) {
  if (!Number.isFinite(totalSeconds)) return '—';
  const seconds = Math.floor(totalSeconds);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m ${seconds % 60}s`;
}

export function formatTimestamp(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'medium' });
}

export function formatNumber(value, digits = 0) {
  return Number.isFinite(value) ? value.toLocaleString(undefined, { maximumFractionDigits: digits }) : '—';
}
