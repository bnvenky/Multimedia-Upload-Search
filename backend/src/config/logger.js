const pino = require('pino');
const { env, isTest } = require('./env');

const logger = pino({
  level: isTest ? 'silent' : env.LOG_LEVEL,
  base: { service: 'multimedia-search-api' },
  timestamp: pino.stdTimeFunctions.isoTime,
  // Secrets must never end up in log files.
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      '*.password',
      '*.passwordHash',
      '*.refreshToken',
      '*.accessToken',
    ],
    censor: '[REDACTED]',
  },
  ...(env.NODE_ENV === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'HH:MM:ss.l', ignore: 'pid,hostname,service' },
    },
  }),
});

module.exports = { logger };
