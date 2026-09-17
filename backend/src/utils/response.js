/** Every successful response uses the same envelope: { success: true, data, meta? } */
function sendSuccess(res, data, { status = 200, meta } = {}) {
  return res.status(status).json({ success: true, data, ...(meta && { meta }) });
}

function buildPagination(page, limit, total) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

module.exports = { sendSuccess, buildPagination };
