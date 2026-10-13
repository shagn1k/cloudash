const { createSimulatedProvider } = require('./simulatedProvider');
const { createAwsProvider } = require('./awsProvider');

/** Chooses where infrastructure data comes from, based on APP_MODE. */
function createInfrastructureProvider(config) {
  return config.appMode === 'aws' ? createAwsProvider(config) : createSimulatedProvider();
}

module.exports = { createInfrastructureProvider };
