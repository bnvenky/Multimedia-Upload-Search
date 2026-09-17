const { Router } = require('express');
const { uploadSingleFile } = require('../middleware/upload');
const { validate } = require('../middleware/validate');
const {
  fileIdParamsSchema,
  listFilesQuerySchema,
  updateFileBodySchema,
  uploadFileBodySchema,
} = require('../schemas/file.schema');

/**
 * Upload middleware chain. Order matters:
 * quota check -> stream the file to disk with limits -> validate text fields -> controller
 */
function uploadHandlers({ controller, limiters }) {
  return [limiters.upload, uploadSingleFile('file'), validate({ body: uploadFileBodySchema }), controller.upload];
}

function createFileRouter({ controller, authenticate, limiters }) {
  const router = Router();

  router.use(authenticate); // every /files route requires a signed-in user

  router.get('/', validate({ query: listFilesQuerySchema }), controller.list);
  router.post('/', ...uploadHandlers({ controller, limiters }));
  router.get('/stats', controller.stats);
  router.get('/:id', validate({ params: fileIdParamsSchema }), controller.getById);
  router.get('/:id/download', validate({ params: fileIdParamsSchema }), controller.downloadUrl);
  router.patch('/:id', validate({ params: fileIdParamsSchema, body: updateFileBodySchema }), controller.update);
  router.delete('/:id', validate({ params: fileIdParamsSchema }), controller.remove);

  return router;
}

module.exports = { createFileRouter, uploadHandlers };
