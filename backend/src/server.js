const { createApp } = require('./app');
const { config } = require('./config');

const server = createApp().listen(config.port, () => {
  console.log(`${config.serviceName} listening on port ${config.port} (mode: ${config.appMode})`);
});

// Docker and EC2 stop containers with SIGTERM; closing cleanly avoids dropped requests.
function shutdown(signal) {
  console.log(`${signal} received, shutting down`);
  server.close(() => process.exit(0));
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
