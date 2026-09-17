const { isDatabaseReady } = require('../config/database');
const { sendSuccess } = require('../utils/response');

function createHealthController(storage) {
  return {
    /** Liveness: the process is running. */
    live(_req, res) {
      sendSuccess(res, {
        status: 'ok',
        uptimeSeconds: Math.round(process.uptime()),
        timestamp: new Date().toISOString(),
      });
    },

    /** Readiness: dependencies are reachable, so a load balancer may send traffic here. */
    ready(_req, res) {
      const database = isDatabaseReady();
      res.status(database ? 200 : 503).json({
        success: database,
        data: {
          status: database ? 'ready' : 'not_ready',
          checks: {
            database: database ? 'up' : 'down',
            storage: storage.isConfigured() ? 'configured' : 'not_configured',
          },
        },
      });
    },
  };
}

module.exports = { createHealthController };
