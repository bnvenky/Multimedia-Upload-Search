const { API_PREFIX } = require('../config/constants');
const { sendSuccess } = require('../utils/response');

/**
 * Controllers only translate HTTP <-> service calls.
 * Validated input comes from `req.validated` (see middleware/validate.js),
 * the signed-in user from `req.user` (see middleware/authenticate.js).
 */
function createFileController(fileService) {
  return {
    async upload(req, res) {
      const file = await fileService.upload(req.user, req.file, req.validated.body);
      res.location(`${API_PREFIX}/files/${file.id}`);
      sendSuccess(res, { file }, { status: 201 });
    },

    async list(req, res) {
      const { items, meta } = await fileService.list(req.user, req.validated.query);
      sendSuccess(res, { items }, { meta });
    },

    async getById(req, res) {
      const file = await fileService.getById(req.user, req.validated.params.id);
      sendSuccess(res, { file });
    },

    async downloadUrl(req, res) {
      const link = await fileService.getDownloadUrl(req.user, req.validated.params.id);
      res.setHeader('Cache-Control', 'no-store');
      sendSuccess(res, link);
    },

    async update(req, res) {
      const file = await fileService.update(req.user, req.validated.params.id, req.validated.body);
      sendSuccess(res, { file });
    },

    async remove(req, res) {
      await fileService.remove(req.user, req.validated.params.id);
      res.status(204).end();
    },

    async stats(req, res) {
      const stats = await fileService.stats(req.user);
      sendSuccess(res, { stats });
    },
  };
}

module.exports = { createFileController };
