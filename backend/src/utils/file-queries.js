const { Types } = require('mongoose');
const { UserModel } = require('../models/user.model');
const { RANKING_CONFIG } = require('./ranking');

/** Who can see what: public files + your own private files (admins see everything). */
function buildAccessFilter(viewer, scope = 'all') {
  const viewerId = new Types.ObjectId(viewer.id);
  if (scope === 'mine') return { owner: viewerId };
  if (viewer.role === 'admin') return {};
  return { $or: [{ visibility: 'public' }, { owner: viewerId }] };
}

/** Access rules + optional type / tag / date filters, as a list of MongoDB conditions. */
function buildFilterConditions(filters, viewer) {
  const conditions = [buildAccessFilter(viewer, filters.scope)];

  if (filters.type?.length) conditions.push({ category: { $in: filters.type } });
  if (filters.tags?.length) conditions.push({ tags: { $all: filters.tags } });
  if (filters.from || filters.to) {
    conditions.push({
      createdAt: {
        ...(filters.from && { $gte: filters.from }),
        ...(filters.to && { $lte: filters.to }),
      },
    });
  }

  return conditions.filter((condition) => Object.keys(condition).length > 0);
}

/** Joins conditions with $and (skipping it when there is only one). */
function combine(conditions) {
  if (conditions.length === 0) return {};
  if (conditions.length === 1) return conditions[0];
  return { $and: conditions };
}

/** Same popularity + freshness formula as utils/ranking.js, computed inside MongoDB. */
const trendingScoreStage = {
  $addFields: {
    trendingScore: {
      $add: [
        {
          $multiply: [
            0.65,
            {
              $min: [1, { $divide: [{ $ln: { $add: [1, '$views'] } }, Math.log1p(RANKING_CONFIG.popularitySaturationViews)] }],
            },
          ],
        },
        {
          $multiply: [
            0.35,
            {
              $pow: [
                0.5,
                {
                  $divide: [
                    { $dateDiff: { startDate: '$createdAt', endDate: '$$NOW', unit: 'hour' } },
                    24 * RANKING_CONFIG.freshnessHalfLifeDays,
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  },
};

const BROWSE_SORT_STAGES = {
  newest: { createdAt: -1, _id: -1 },
  oldest: { createdAt: 1, _id: 1 },
  views: { views: -1, createdAt: -1, _id: -1 },
  size: { size: -1, _id: -1 },
  name: { title: 1, _id: 1 },
  trending: { trendingScore: -1, createdAt: -1, _id: -1 },
};

/** Adds `owner: { _id, name }` (like populate, but inside an aggregation). */
function ownerLookupStages() {
  return [
    {
      $lookup: {
        from: UserModel.collection.name,
        localField: 'owner',
        foreignField: '_id',
        as: 'owner',
        pipeline: [{ $project: { name: 1 } }],
      },
    },
    { $unwind: { path: '$owner', preserveNullAndEmptyArrays: true } },
  ];
}

/** Filter + sort + paginate + total count in ONE database round-trip using $facet. */
function buildBrowsePipeline(match, sort, page, limit) {
  return [
    { $match: match },
    { $project: { searchIndex: 0 } },
    ...(sort === 'trending' ? [trendingScoreStage] : []),
    {
      $facet: {
        items: [{ $sort: BROWSE_SORT_STAGES[sort] }, { $skip: (page - 1) * limit }, { $limit: limit }, ...ownerLookupStages()],
        total: [{ $count: 'count' }],
      },
    },
  ];
}

module.exports = { buildAccessFilter, buildFilterConditions, combine, buildBrowsePipeline };
