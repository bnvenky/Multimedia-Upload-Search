const { Router } = require('express');
const { validate } = require('../middleware/validate');
const { loginSchema, registerSchema } = require('../schemas/auth.schema');

function createAuthRouter({ controller, authenticate, trustedOrigin, limiters }) {
  const router = Router();

  router.post('/register', limiters.auth, validate({ body: registerSchema }), controller.register);
  router.post('/login', limiters.auth, limiters.login, validate({ body: loginSchema }), controller.login);
  router.post('/refresh', limiters.refresh, trustedOrigin, controller.refresh);
  router.post('/logout', trustedOrigin, controller.logout);
  router.post('/logout-all', authenticate, controller.logoutAll);
  router.get('/me', authenticate, controller.me);

  return router;
}

module.exports = { createAuthRouter };
