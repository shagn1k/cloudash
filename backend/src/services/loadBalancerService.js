const {
  DescribeTargetHealthCommand,
  DescribeTargetGroupsCommand,
  DescribeLoadBalancersCommand,
} = require('@aws-sdk/client-elastic-load-balancing-v2');

// When targets disagree, the "worst" state wins, so the dashboard never hides a problem.
const SEVERITY_ORDER = ['unhealthy', 'unavailable', 'initial', 'draining', 'unused', 'healthy'];

function summarizeTargetHealth(targets) {
  if (targets.length === 0) return 'unavailable'; // nothing registered in the target group
  const states = new Set(targets.map((target) => target.state));
  return SEVERITY_ORDER.find((state) => states.has(state)) || 'unavailable';
}

/** ALB: target health (is the EC2 instance passing the /api/health check?) and load balancer state. */
function createLoadBalancerService({ client, aws }) {
  return {
    async getTargetHealth() {
      if (!aws.targetGroupArn) {
        return { configured: false, summary: 'not_configured', targets: [] };
      }

      const response = await client.send(new DescribeTargetHealthCommand({ TargetGroupArn: aws.targetGroupArn }));
      const targets = (response.TargetHealthDescriptions || []).map((description) => ({
        id: description.Target?.Id,
        port: description.Target?.Port,
        // healthy | unhealthy | initial | unused | draining | unavailable
        state: description.TargetHealth?.State,
        reason: description.TargetHealth?.Reason,
        description: description.TargetHealth?.Description,
      }));

      return { configured: true, summary: summarizeTargetHealth(targets), targets };
    },

    async getLoadBalancer() {
      if (!aws.targetGroupArn) return { configured: false, state: 'not_configured' };

      // A target group knows which load balancer(s) it is attached to.
      const groups = await client.send(new DescribeTargetGroupsCommand({ TargetGroupArns: [aws.targetGroupArn] }));
      const loadBalancerArn = groups.TargetGroups?.[0]?.LoadBalancerArns?.[0];
      if (!loadBalancerArn) return { configured: true, state: 'unavailable' };

      const response = await client.send(new DescribeLoadBalancersCommand({ LoadBalancerArns: [loadBalancerArn] }));
      const balancer = response.LoadBalancers?.[0];

      return {
        configured: true,
        name: balancer?.LoadBalancerName,
        dnsName: balancer?.DNSName,
        scheme: balancer?.Scheme,
        // provisioning | active | active_impaired | failed
        state: balancer?.State?.Code ?? 'unavailable',
      };
    },
  };
}

module.exports = { createLoadBalancerService, summarizeTargetHealth };
