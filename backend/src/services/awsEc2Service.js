const { DescribeInstancesCommand } = require('@aws-sdk/client-ec2');

/** EC2: the real state of the instance that runs CloudOpsHub. */
function createEc2Service({ client, aws }) {
  return {
    async getInstance() {
      if (!aws.instanceId) {
        return { configured: false, state: 'not_configured' };
      }

      const response = await client.send(new DescribeInstancesCommand({ InstanceIds: [aws.instanceId] }));
      const instance = response.Reservations?.[0]?.Instances?.[0];

      if (!instance) {
        return { configured: true, instanceId: aws.instanceId, state: 'not_found' };
      }

      // State.Name is one of: pending | running | shutting-down | terminated | stopping | stopped
      return {
        configured: true,
        instanceId: instance.InstanceId,
        state: instance.State?.Name ?? 'unknown',
        instanceType: instance.InstanceType,
        availabilityZone: instance.Placement?.AvailabilityZone,
        launchTime: instance.LaunchTime ? new Date(instance.LaunchTime).toISOString() : null,
      };
    },
  };
}

module.exports = { createEc2Service };
