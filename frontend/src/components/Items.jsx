import StatusBadge from './StatusBadge';

/** A labelled status (left) with a badge (right). Used for ONLINE / HEALTHY / RUNNING style values. */
export function StatusItem({ label, value }) {
  return (
    <div className="item">
      <span className="item__label">{label}</span>
      <StatusBadge value={value} />
    </div>
  );
}

/** A labelled number (left-aligned label, large value). Used for CPU %, request count, etc. */
export function MetricItem({ label, value, unit, hint }) {
  return (
    <div className="item item--metric">
      <span className="item__label">{label}</span>
      <span className="metric">
        {value}
        {unit && value !== '—' ? <span className="metric__unit">{unit}</span> : null}
      </span>
      {hint ? <span className="item__hint">{hint}</span> : null}
    </div>
  );
}

/** A labelled plain-text value. Used for version, environment, timestamps. */
export function TextItem({ label, value, mono = false }) {
  return (
    <div className="item item--metric">
      <span className="item__label">{label}</span>
      <span className={`text-value${mono ? ' text-value--mono' : ''}`}>{value || '—'}</span>
    </div>
  );
}
