const { GetMetricStatisticsCommand, DescribeAlarmsCommand } = require('@aws-sdk/client-cloudwatch');

const MINUTE = 60 * 1000;

/**
 * CloudWatch: real EC2 metrics and alarm states.
 *
 * - CPUUtilization: published every 5 minutes (free "basic monitoring"), so the newest value can be
 *   up to ~5 minutes old. That is normal and is shown to the user as the datapoint timestamp.
 * - StatusCheckFailed: 0 = both EC2 status checks passed, 1 = at least one failed. Published every minute.
 */
function createCloudWatchService({ client, aws, now = () => new Date() }) {
  const instanceDimension = [{ Name: 'InstanceId', Value: aws.instanceId }];

  async function latestDatapoint({ metricName, statistic, periodSeconds, windowMinutes, unit }) {
    const end = now();
    const response = await client.send(
      new GetMetricStatisticsCommand({
        Namespace: 'AWS/EC2',
        MetricName: metricName,
        Dimensions: instanceDimension,
        StartTime: new Date(end.getTime() - windowMinutes * MINUTE),
        EndTime: end,
        Period: periodSeconds,
        Statistics: [statistic],
        ...(unit ? { Unit: unit } : {}),
      }),
    );

    const newest = [...(response.Datapoints || [])].sort(
      (a, b) => new Date(b.Timestamp) - new Date(a.Timestamp),
    )[0];

    return newest
      ? { value: newest[statistic], timestamp: new Date(newest.Timestamp).toISOString() }
      : null; // CloudWatch has no datapoints yet (e.g. the instance was just launched)
  }

  return {
    async getCpuUtilization() {
      if (!aws.instanceId) return { configured: false, value: null, state: 'not_configured' };

      const point = await latestDatapoint({
        metricName: 'CPUUtilization',
        statistic: 'Average',
        periodSeconds: 300,
        windowMinutes: 30,
        unit: 'Percent',
      });

      return point
        ? { configured: true, value: Number(point.value.toFixed(2)), timestamp: point.timestamp, periodSeconds: 300 }
        : { configured: true, value: null, state: 'insufficient_data' };
    },

    async getStatusChecks() {
      if (!aws.instanceId) return { configured: false, state: 'not_configured' };

      const point = await latestDatapoint({
        metricName: 'StatusCheckFailed',
        statistic: 'Maximum',
        periodSeconds: 60,
        windowMinutes: 15,
      });

      if (!point) return { configured: true, state: 'insufficient_data' };
      return { configured: true, state: point.value > 0 ? 'failed' : 'passed', timestamp: point.timestamp };
    },

    /** Alarms created by this project (names start with the configured prefix). */
    async getAlarms() {
      const response = await client.send(
        new DescribeAlarmsCommand({ AlarmNamePrefix: aws.alarmPrefix, AlarmTypes: ['MetricAlarm'] }),
      );
      const alarms = (response.MetricAlarms || []).map((alarm) => ({
        name: alarm.AlarmName,
        state: alarm.StateValue, // OK | ALARM | INSUFFICIENT_DATA
      }));

      let overall = 'ok';
      if (alarms.some((alarm) => alarm.state === 'ALARM')) overall = 'alarm';
      else if (alarms.length > 0 && alarms.every((alarm) => alarm.state === 'INSUFFICIENT_DATA')) {
        overall = 'insufficient_data';
      }

      return { overall, alarms };
    },
  };
}

module.exports = { createCloudWatchService };
