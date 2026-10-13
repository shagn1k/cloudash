/**
 * A dashboard card with a title and three possible bodies:
 *   - loading skeleton (first load only)
 *   - error state with a retry button (nothing loaded yet)
 *   - the real content, via render-prop `children(data)`
 *
 * If a refresh fails but older data exists, the data stays visible with a warning banner.
 */
export default function Panel({ title, subtitle, resource, children }) {
  const { data, error, loading, reload } = resource;

  return (
    <section className="panel" aria-label={title}>
      <header className="panel__header">
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </header>

      {loading ? (
        <div className="skeleton" role="status" aria-label={`Loading ${title}`}>
          <span /><span /><span /><span />
        </div>
      ) : null}

      {!loading && error && !data ? (
        <div className="state state--error" role="alert">
          <strong>Unavailable</strong>
          <p>{error.message}</p>
          <button type="button" className="btn btn--small" onClick={reload}>Retry</button>
        </div>
      ) : null}

      {!loading && data ? (
        <>
          {error ? (
            <p className="stale-warning" role="alert">
              Showing last known data. Latest refresh failed: {error.message}
            </p>
          ) : null}
          <div className="panel__body">{children(data)}</div>
        </>
      ) : null}
    </section>
  );
}
