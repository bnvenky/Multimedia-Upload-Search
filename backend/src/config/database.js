const mongoose = require('mongoose');
const { env } = require('./env');
const { logger } = require('./logger');

mongoose.set('strictQuery', true);

async function connectDatabase(uri = env.MONGODB_URI, dbName = env.MONGODB_DB_NAME) {
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
  mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));
  mongoose.connection.on('error', (error) => logger.error({ err: error }, 'MongoDB connection error'));

  await mongoose.connect(uri, {
    dbName,
    maxPoolSize: 20,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 10_000,
    socketTimeoutMS: 45_000,
  });

  logger.info({ dbName }, 'MongoDB connected');
  return mongoose.connection;
}

async function disconnectDatabase() {
  await mongoose.disconnect();
}

function isDatabaseReady() {
  return mongoose.connection.readyState === mongoose.ConnectionStates.connected;
}

module.exports = { connectDatabase, disconnectDatabase, isDatabaseReady };
