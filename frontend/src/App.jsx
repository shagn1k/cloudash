import Dashboard from './components/Dashboard';
import Header from './components/Header';
import { useApiResource } from './hooks/useApiResource';
import { api } from './services/api';

export default function App() {
  // Each endpoint is polled independently, so one failing endpoint never blanks the whole dashboard.
  const health = useApiResource(api.getHealth, 10000);
  const status = useApiResource(api.getStatus, 15000);
  const metrics = useApiResource(api.getMetrics, 15000);
  const deployment = useApiResource(api.getDeployment, 60000);

  const healthState = health.error ? 'offline' : health.data ? 'healthy' : 'checking';

  const refreshAll = () => {
    [health, status, metrics, deployment].forEach((resource) => resource.reload());
  };

  return (
    <>
      <Header
        status={status.data}
        healthState={healthState}
        lastUpdated={health.updatedAt}
        onRefresh={refreshAll}
      />
      <Dashboard health={health} status={status} metrics={metrics} deployment={deployment} />
      <footer className="footer">
        CloudOpsHub · values are labelled by data source: simulated in development, retrieved from AWS in production mode.
      </footer>
    </>
  );
}
