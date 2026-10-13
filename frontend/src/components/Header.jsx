import StatusBadge from './StatusBadge';

/**
 * Shows where the numbers come from. This matters: development data is simulated,
 * and only AWS mode shows real AWS values.
 */
export default function Header({ status, healthState, onRefresh, lastUpdated }) {
  const dataSource = status?.dataSource;
  const isAws = dataSource === 'aws';

  return (
    <header className="topbar">
      <div className="topbar__brand">
        <img src="/favicon.svg" alt="" width="36" height="36" />
        <div>
          <h1>CloudOpsHub</h1>
          <p>AWS infrastructure monitoring &amp; DevOps platform</p>
        </div>
      </div>

      <div className="topbar__actions">
        {dataSource ? (
          <span className={`mode mode--${isAws ? 'aws' : 'dev'}`} title="Where the infrastructure values come from">
            {isAws ? 'AWS PRODUCTION · LIVE AWS DATA' : 'DEVELOPMENT · SIMULATED DATA'}
          </span>
        ) : (
          <span className="mode mode--unknown">DATA SOURCE UNKNOWN</span>
        )}
        <StatusBadge value={healthState === 'healthy' ? 'ONLINE' : healthState === 'checking' ? 'PENDING' : 'OFFLINE'} />
        <span className="topbar__updated">
          {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Not updated yet'}
        </span>
        <button type="button" className="btn" onClick={onRefresh}>Refresh</button>
      </div>
    </header>
  );
}
