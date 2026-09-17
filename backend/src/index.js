// version check for Node.js
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const buffer = require('buffer');
if (typeof buffer.SlowBuffer === 'undefined') {
  buffer.SlowBuffer = buffer.Buffer;
}

const http = require('node:http');
const { createApp } = require('./app');
const { DOCS_PATH } = require('./config/constants');
const { connectDatabase, disconnectDatabase } = require('./config/database');
const { env } = require('./config/env');
const { logger } = require('./config/logger');
const { EventBus } = require('./events/event-bus');
const { CloudinaryStorage } = require('./services/storage/cloudinary.storage');
const { createSocketGateway } = require('./sockets/socket.gateway');

const SHUTDOWN_TIMEOUT_MS = 10_000;

async function start() {
  await connectDatabase();

  const events = new EventBus();
  const storage = new CloudinaryStorage();
  if (!storage.isConfigured()) {
    logger.warn('CLOUDINARY_URL is not set — uploads are disabled until it is configured');
  }

  const { app, tokenService } = createApp({ storage, events });
  const server = http.createServer(app);
  const sockets = createSocketGateway(server, { tokens: tokenService, events, allowedOrigins: env.CLIENT_ORIGINS });

  server.listen(env.PORT, () => {
    logger.info(`API listening on http://localhost:${env.PORT} (docs: http://localhost:${env.PORT}${DOCS_PATH})`);
  });

  // Graceful shutdown: stop accepting connections, finish in-flight work, close the database.
  let shuttingDown = false;
  async function shutdown(signal, exitCode = 0) {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, 'Shutting down');

    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS).unref();

    try {
      await sockets.close(); // also closes the HTTP server
      await disconnectDatabase();
      logger.info('Shutdown complete');
      process.exit(exitCode);
    } catch (error) {
      logger.error({ err: error }, 'Error during shutdown');
      process.exit(1);
    }
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    logger.fatal({ err: reason }, 'Unhandled promise rejection');
    shutdown('unhandledRejection', 1);
  });
}

start().catch((error) => {
  logger.fatal({ err: error }, 'Failed to start server');
  process.exit(1);
});
