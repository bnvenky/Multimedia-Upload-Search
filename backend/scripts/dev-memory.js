/**
 * Runs the API against a throwaway in-memory MongoDB, pre-filled with demo data.
 * Useful to try the project without a MongoDB Atlas account:
 *
 *   npm run dev:memory
 */
require('dotenv').config({ quiet: true });
const { MongoMemoryServer } = require('mongodb-memory-server');

(async () => {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.JWT_ACCESS_SECRET ??= 'in-memory-development-secret-please-change-me';
  console.log(`In-memory MongoDB started at ${process.env.MONGODB_URI}`);

  const mongoose = require('mongoose');
  const { seedDemoData } = require('./seed');

  // The server connects on start; seed as soon as that connection is open.
  mongoose.connection.once('open', () => {
    seedDemoData().catch((error) => console.error('Demo seeding failed:', error.message));
  });

  const stop = async () => {
    await mongod.stop();
  };
  process.once('exit', stop);

  require('../src/index');
})();
