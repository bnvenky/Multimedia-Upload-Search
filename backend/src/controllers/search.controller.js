const { sendSuccess } = require('../utils/response');

function createSearchController(searchService) {
  return {
    async search(req, res) {
      const { items, meta } = await searchService.search(req.user, req.validated.query);
      sendSuccess(res, { items }, { meta });
    },

    async suggest(req, res) {
      const suggestions = await searchService.suggest(req.user, req.validated.query);
      sendSuccess(res, suggestions);
    },

    async popularTags(req, res) {
      const tags = await searchService.popularTags(req.user, req.validated.query);
      sendSuccess(res, { tags });
    },
  };
}

module.exports = { createSearchController };
