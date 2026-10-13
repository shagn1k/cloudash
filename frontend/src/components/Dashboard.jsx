import { MetricItem, StatusItem, TextItem } from './Items';
import Panel from './Panel';
import { formatNumber, formatTimestamp, formatUptime } from '../utils/format';

/** Merges two API resources so one panel can show data from both endpoints. */
function combine(first, second) {
  return {
    data: first.data && second.data ? { first: first.data, second: second.data } : null,
    error: first.error || second.error,
    loading: first.loading || second.loading,
    reload: () => {
      first.reload();
      second.reload();
    },
  };
}

function ApplicationPanel({ health }) {
  return (
    <Panel title="Application Status" subtitle="Live check of the CloudOpsHub API" resource={health}>
      {(data) => {
        const online = data.status === 'healthy';
        return (
          <div className="grid grid--2">
            <StatusItem label="Application" value={online && !health.error ? 'ONLINE' : 'OFFLINE'} />
            <StatusItem label="API" value={online && !health.error ? 'HEALTHY' : 'UNHEALTHY'} />
            <StatusItem label="Server" value={online && !health.error ? 'RUNNING' : 'STOPPED'} />
            <TextItem label="Last Health Check" value={formatTimestamp(data.checkedAt)} />
          </div>
        );
      }}
    </Panel>
  );
}

function InfrastructurePanel({ status, metrics }) {
  return (
    <Panel
      title="Infrastructure Status"
      subtitle="Compute and runtime health"
      resource={combine(status, metrics)}
    >
      {({ first: statusData, second: metricsData }) => (
        <>
          <div className="grid grid--2">
            <StatusItem label="EC2 Instance Status" value={statusData.infrastructure?.ec2?.state} />
            <StatusItem label="Docker Container Status" value={statusData.infrastructure?.container?.state} />
          </div>
          <div className="grid grid--4 grid--spaced">
            <MetricItem label="EC2 CPU Utilization" value={formatNumber(metricsData.cpu, 1)} unit="%" />
            <MetricItem label="Node.js Memory Usage" value={formatNumber(metricsData.memory, 1)} unit="%" />
            <MetricItem label="API Request Count" value={formatNumber(metricsData.requests)} />
            <MetricItem label="API Error Rate" value={formatNumber(metricsData.errorRate, 2)} unit="%" />
            <MetricItem label="API Response Time" value={formatNumber(metricsData.responseTime, 0)} unit=" ms" />
            <MetricItem label="Application Uptime" value={formatUptime(metricsData.uptime)} />
          </div>
        </>
      )}
    </Panel>
  );
}

function LoadBalancerPanel({ status }) {
  return (
    <Panel title="Load Balancer" subtitle="Application Load Balancer & target health" resource={status}>
      {(data) => (
        <div className="grid grid--2">
          <StatusItem label="AWS ALB Status" value={data.loadBalancer?.status} />
          <StatusItem label="ALB Target Health" value={data.loadBalancer?.targetHealth} />
        </div>
      )}
    </Panel>
  );
}

function MonitoringPanel({ status }) {
  return (
    <Panel title="Monitoring" subtitle="CloudWatch" resource={status}>
      {(data) => (
        <div className="grid grid--3">
          <StatusItem label="CloudWatch Alarms" value={data.monitoring?.cloudwatch} />
          <MetricItem
            label="CloudWatch CPU Utilization"
            value={formatNumber(data.monitoring?.cpuUtilization, 1)}
            unit="%"
          />
          <StatusItem label="CloudWatch EC2 Status Checks" value={data.monitoring?.ec2StatusChecks} />
        </div>
      )}
    </Panel>
  );
}

function DeploymentPanel({ deployment }) {
  return (
    <Panel title="Deployment" subtitle="What is running, and since when" resource={deployment}>
      {(data) => (
        <div className="grid grid--3">
          <TextItem label="Current Version" value={data.version} mono />
          <TextItem label="Environment" value={data.environment?.toUpperCase()} />
          <StatusItem label="Deployment Status" value={data.status} />
          <TextItem label="Last Deployment" value={formatTimestamp(data.lastDeployment)} />
          <TextItem label="Container Image Version" value={data.imageVersion} mono />
        </div>
      )}
    </Panel>
  );
}

/** Lays out the dashboard sections. Data is fetched by the parent (App) and passed in. */
export default function Dashboard({ health, status, metrics, deployment }) {
  return (
    <main className="dashboard">
      <div className="dashboard__row dashboard__row--wide">
        <ApplicationPanel health={health} />
        <DeploymentPanel deployment={deployment} />
      </div>
      <InfrastructurePanel status={status} metrics={metrics} />
      <div className="dashboard__row">
        <LoadBalancerPanel status={status} />
        <MonitoringPanel status={status} />
      </div>
    </main>
  );
}
