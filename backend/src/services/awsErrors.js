const { HttpError } = require('../middleware/errorHandler');

/**
 * Turns raw AWS SDK errors into SHORT, SAFE messages.
 *
 * Raw AWS errors often contain account IDs and role ARNs
 * ("User: arn:aws:sts::123456789012:assumed-role/... is not authorized to perform ...").
 * The dashboard is reachable from the internet, so those details must stay in the server logs
 * and never reach the browser.
 */

const CATEGORIES = [
  {
    code: 'CREDENTIALS',
    names: [
      'CredentialsProviderError', 'UnrecognizedClientException', 'InvalidClientTokenId',
      'ExpiredToken', 'ExpiredTokenException', 'AuthFailure', 'InvalidSignatureException',
    ],
    message: 'Could not authenticate to AWS. On EC2 check the instance IAM role; locally check your AWS credentials/profile.',
  },
  {
    code: 'ACCESS_DENIED',
    names: ['AccessDenied', 'AccessDeniedException', 'UnauthorizedOperation', 'UnauthorizedAccess', 'AuthorizationError'],
    message: 'AWS denied the request. The IAM role is missing a permission this call needs.',
  },
  {
    code: 'THROTTLED',
    names: ['Throttling', 'ThrottlingException', 'RequestLimitExceeded', 'TooManyRequestsException'],
    message: 'AWS is rate-limiting requests. The dashboard will retry on its next refresh.',
  },
  {
    code: 'NOT_FOUND',
    names: [
      'InvalidInstanceID.NotFound', 'InvalidInstanceID.Malformed', 'RepositoryNotFoundException',
      'TargetGroupNotFound', 'LoadBalancerNotFound', 'ValidationError',
    ],
    message: 'The configured AWS resource was not found. Check the instance ID / ARN / repository name settings.',
  },
  {
    code: 'UNREACHABLE',
    names: ['TimeoutError', 'NetworkingError', 'ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT', 'EAI_AGAIN'],
    message: 'Could not reach the AWS API (network problem).',
  },
];

function describeAwsError(error) {
  const names = [error?.name, error?.Code, error?.code, error?.cause?.code].filter(Boolean);
  const httpStatus = error?.$metadata?.httpStatusCode;

  const match = CATEGORIES.find((category) => category.names.some((name) => names.includes(name)));
  if (match) return { code: match.code, message: match.message };

  if (httpStatus === 401) return { code: CATEGORIES[0].code, message: CATEGORIES[0].message };
  if (httpStatus === 403) return { code: CATEGORIES[1].code, message: CATEGORIES[1].message };

  return { code: 'UNKNOWN', message: 'The AWS request failed. See the server logs for details.' };
}

/** Wraps an AWS failure as a 502 (bad gateway: our upstream, AWS, failed) with a safe message. */
function toHttpError(serviceName, error) {
  const { code, message } = describeAwsError(error);
  const httpError = new HttpError(502, `${serviceName}: ${message}`);
  httpError.code = code;
  return httpError;
}

module.exports = { describeAwsError, toHttpError };
