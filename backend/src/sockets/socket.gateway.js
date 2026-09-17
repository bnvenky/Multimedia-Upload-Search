const { Server } = require('socket.io');
const { logger } = require('../config/logger');
const { Events } = require('../events/event-bus');
const { AppError } = require('../utils/app-error');

/** Event names sent to browsers. */
const SocketEvents = Object.freeze({
  FILE_UPLOADED: 'file:uploaded',
  FILE_UPDATED: 'file:updated',
  FILE_DELETED: 'file:deleted',
  SESSION_EXPIRED: 'session:expired',
});

const MAX_TIMEOUT_MS = 2 ** 31 - 1;
const userRoom = (userId) => `user:${userId}`;

/**
 * Real-time notifications over Socket.IO.
 * - Clients authenticate with their JWT access token: io(url, { auth: { token } }).
 * - Every socket joins a private room "user:<id>".
 * - Public file events go to everyone; private file events only to the owner.
 */
function createSocketGateway(httpServer, { tokens, events, allowedOrigins }) {
  const io = new Server(httpServer, {
    cors: { origin: allowedOrigins, credentials: true },
    serveClient: false,
    maxHttpBufferSize: 100 * 1024, // clients never send large payloads
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (typeof token !== 'string') return next(new Error('UNAUTHORIZED'));
    try {
      socket.data.user = tokens.verifyAccessToken(token);
      next();
    } catch (error) {
      next(new Error(error instanceof AppError ? error.code : 'UNAUTHORIZED'));
    }
  });

  io.on('connection', (socket) => {
    const { user } = socket.data;
    socket.join(userRoom(user.id));

    // Access tokens are short-lived: disconnect when it expires so the client reconnects with a fresh one.
    const expiresInMs = Math.min(Math.max(0, user.expiresAt - Date.now()), MAX_TIMEOUT_MS);
    const expiryTimer = setTimeout(() => {
      socket.emit(SocketEvents.SESSION_EXPIRED);
      socket.disconnect(true);
    }, expiresInMs);

    socket.on('disconnect', () => clearTimeout(expiryTimer));
    logger.debug({ userId: user.id, socketId: socket.id }, 'Socket connected');
  });

  function emitForVisibility(visibility, ownerId, eventName, payload) {
    if (visibility === 'public') io.emit(eventName, payload);
    else io.to(userRoom(ownerId)).emit(eventName, payload);
  }

  const unsubscribers = [
    events.subscribe(Events.FILE_UPLOADED, ({ file }) => {
      emitForVisibility(file.visibility, file.owner.id, SocketEvents.FILE_UPLOADED, { file });
    }),

    events.subscribe(Events.FILE_UPDATED, ({ file, previousVisibility }) => {
      emitForVisibility(file.visibility, file.owner.id, SocketEvents.FILE_UPDATED, { file });
      // Public -> private: everyone else must drop it from their lists.
      if (previousVisibility === 'public' && file.visibility === 'private') {
        io.except(userRoom(file.owner.id)).emit(SocketEvents.FILE_DELETED, { fileId: file.id });
      }
    }),

    events.subscribe(Events.FILE_DELETED, ({ fileId, ownerId, visibility }) => {
      emitForVisibility(visibility, ownerId, SocketEvents.FILE_DELETED, { fileId });
    }),
  ];

  return {
    io,
    close: () =>
      new Promise((resolve) => {
        unsubscribers.forEach((unsubscribe) => unsubscribe());
        io.close(() => resolve());
      }),
  };
}

module.exports = { createSocketGateway, SocketEvents };
