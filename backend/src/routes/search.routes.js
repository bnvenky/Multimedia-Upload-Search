const { Router } = require('express');
const { validate } = require('../middleware/validate');
const { popularTagsQuerySchema, searchQuerySchema, suggestionsQuerySchema } = require('../schemas/search.schema');

function createSearchRouter({ controller, authenticate }) {
  const router = Router();

  router.use(authenticate); // search is only available to signed-in users

  router.get('/', validate({ query: searchQuerySchema }), controller.search);
  router.get('/suggestions', validate({ query: suggestionsQuerySchema }), controller.suggest);
  router.get('/tags', validate({ query: popularTagsQuerySchema }), controller.popularTags);

  return router;
}

module.exports = { createSearchRouter };
