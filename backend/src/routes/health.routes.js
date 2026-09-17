const { Router } = require('express');

function createHealthRouter({ controller }) {
  const router = Router();

  router.get('/', controller.live);
  router.get('/ready', controller.ready);

  return router;
}

module.exports = { createHealthRouter };
