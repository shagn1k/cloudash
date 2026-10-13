const { EC2Client } = require('@aws-sdk/client-ec2');
const { CloudWatchClient } = require('@aws-sdk/client-cloudwatch');
const { ElasticLoadBalancingV2Client } = require('@aws-sdk/client-elastic-load-balancing-v2');
const { ECRClient } = require('@aws-sdk/client-ecr');

/**
 * Creates one SDK client per AWS service.
 *
 * Notice there are NO credentials here. The SDK uses its "default credential provider chain":
 *   1. environment variables / shared profile / SSO  (your laptop)
 *   2. the EC2 instance role via the metadata service (AWS - temporary credentials, auto-rotated)
 * so no secret ever lives in this code or in the repository.
 */
function createAwsClients({ region }) {
  return {
    ec2: new EC2Client({ region }),
    cloudwatch: new CloudWatchClient({ region }),
    elbv2: new ElasticLoadBalancingV2Client({ region }),
    ecr: new ECRClient({ region }),
  };
}

module.exports = { createAwsClients };
