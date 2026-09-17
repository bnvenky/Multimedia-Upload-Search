const { EventEmitter } = require('node:events');
const { logger } = require('../config/logger');

/** Names of the domain events published by the services. */
const Events = Object.freeze({
  FILE_UPLOADED: 'file.uploaded', // payload: { file }
  FILE_UPDATED: 'file.updated', // payload: { file, previousVisibility }
  FILE_DELETED: 'file.deleted', // payload: { fileId, ownerId, visibility }
});

/**
 * In-process event bus. Services announce facts ("a file was uploaded") without knowing who
 * listens; the WebSocket gateway is one listener. To run several server instances, only this
 * file would change (e.g. to Redis pub/sub) — services and sockets stay the same.
 */
class EventBus {
  constructor() {
    this.emitter = new EventEmitter();
  }

  publish(name, payload) {
    this.emitter.emit(name, payload);
  }

  /** Returns an unsubscribe function. A failing listener is logged and never crashes the request. */
  subscribe(name, handler) {
    const safeHandler = (payload) => {
      Promise.resolve()
        .then(() => handler(payload))
        .catch((error) => logger.error({ err: error, event: name }, 'Event handler failed'));
    };
    this.emitter.on(name, safeHandler);
    return () => this.emitter.off(name, safeHandler);
  }
}

module.exports = { EventBus, Events };
