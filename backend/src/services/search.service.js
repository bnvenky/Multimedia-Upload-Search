const { performance } = require('node:perf_hooks');
const { MediaFileModel } = require('../models/media-file.model');
const { toFileDto } = require('../utils/file-mapper');
const { buildAccessFilter, buildFilterConditions, combine } = require('../utils/file-queries');
const { rankDocuments } = require('../utils/ranking');
const { buildPagination } = require('../utils/response');
const { analyzeQuery, escapeRegex, normalizeTags, tokenize } = require('../utils/text-analysis');

/** Max number of candidates re-ranked in memory for one query. */
const CANDIDATE_LIMIT = 500;

class SearchService {
  /**
   * Two-stage search ("retrieve, then re-rank" — the pattern real search engines use):
   *  1. Retrieval in MongoDB (index-backed): files that share character trigrams with the query,
   *     inside the viewer's access scope and filters, best trigram overlap first.
   *  2. Ranking in Node.js: field-weighted relevance with typo tolerance, blended with
   *     popularity and freshness (see utils/ranking.js).
   */
  async search(viewer, params) {
    const startedAt = performance.now();
    const rawQuery = (params.query ?? params.q ?? '').trim();
    const analyzed = analyzeQuery(rawQuery);
    const baseMeta = { query: rawQuery, terms: analyzed.terms, sort: params.sort };

    if (analyzed.terms.length === 0) {
      return {
        items: [],
        meta: { ...buildPagination(params.page, params.limit, 0), ...baseMeta, candidateLimitReached: false, tookMs: 0 },
      };
    }

    // Stage 1 — retrieval
    const match = combine([...buildFilterConditions(params, viewer), { 'searchIndex.trigrams': { $in: analyzed.trigrams } }]);
    const candidates = await MediaFileModel.aggregate([
      { $match: match },
      {
        $project: {
          title: 1,
          originalName: 1,
          tags: 1,
          description: 1,
          views: 1,
          size: 1,
          createdAt: 1,
          overlap: { $size: { $setIntersection: ['$searchIndex.trigrams', analyzed.trigrams] } },
        },
      },
      { $sort: { overlap: -1, views: -1, createdAt: -1 } },
      { $limit: CANDIDATE_LIMIT },
    ]);

    // Stage 2 — ranking
    const ranked = rankDocuments(
      candidates.map((candidate) => ({ ...candidate, id: candidate._id.toString() })),
      analyzed,
      { sort: params.sort },
    );

    // Load full documents only for the requested page.
    const pageHits = ranked.slice((params.page - 1) * params.limit, params.page * params.limit);
    const records = await MediaFileModel.find({ _id: { $in: pageHits.map((hit) => hit.document._id) } })
      .populate('owner', 'name')
      .lean();
    const recordsById = new Map(records.map((record) => [record._id.toString(), record]));

    const items = pageHits
      .filter((hit) => recordsById.has(hit.document.id))
      .map((hit) => ({ ...toFileDto(recordsById.get(hit.document.id)), score: hit.score }));

    return {
      items,
      meta: {
        ...buildPagination(params.page, params.limit, ranked.length),
        ...baseMeta,
        candidateLimitReached: candidates.length === CANDIDATE_LIMIT,
        tookMs: Math.round(performance.now() - startedAt),
      },
    };
  }

  /** Autocomplete: tags (most used first) and file titles (most viewed first) for the last typed word. */
  async suggest(viewer, { q, limit }) {
    const access = buildAccessFilter(viewer);
    const lastWord = tokenize(q).pop();
    const tagPrefix = normalizeTags(q)[0];

    const [tags, files] = await Promise.all([
      tagPrefix
        ? MediaFileModel.aggregate([
            { $match: combine([access, { tags: { $regex: `^${escapeRegex(tagPrefix)}` } }]) },
            { $unwind: '$tags' },
            { $match: { tags: { $regex: `^${escapeRegex(tagPrefix)}` } } },
            { $group: { _id: '$tags', count: { $sum: 1 } } },
            { $sort: { count: -1, _id: 1 } },
            { $limit: limit },
          ])
        : [],
      lastWord
        ? MediaFileModel.find(combine([access, { 'searchIndex.tokens': { $regex: `^${escapeRegex(lastWord)}` } }]))
            .select('title category')
            .sort({ views: -1, createdAt: -1 })
            .limit(limit)
            .lean()
        : [],
    ]);

    return {
      tags: tags.map((tag) => ({ tag: tag._id, count: tag.count })),
      files: files.map((file) => ({ id: file._id.toString(), title: file.title, category: file.category })),
    };
  }

  async popularTags(viewer, { limit, scope }) {
    const rows = await MediaFileModel.aggregate([
      { $match: buildAccessFilter(viewer, scope) },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: limit },
    ]);
    return rows.map((row) => ({ tag: row._id, count: row.count }));
  }
}

module.exports = { SearchService, CANDIDATE_LIMIT };
