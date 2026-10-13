import { toneFor } from '../utils/format';

/** Coloured pill showing a status word, e.g. RUNNING / HEALTHY / FAILED. */
export default function StatusBadge({ value }) {
  const label = value ? String(value).replace(/_/g, ' ').toUpperCase() : 'UNKNOWN';
  return (
    <span className={`badge badge--${toneFor(value)}`}>
      <span className="badge__dot" aria-hidden="true" />
      {label}
    </span>
  );
}
