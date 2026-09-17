const { AppError } = require('../utils/app-error');

/**
 * Validates `req.params`, `req.query` and `req.body` against Zod schemas.
 * Parsed (trimmed, coerced, defaulted) values are stored on `req.validated`.
 *
 * Because every value must match a schema, payloads like `{ "email": { "$gt": "" } }`
 * are rejected before they can reach MongoDB (NoSQL injection protection).
 */
function validate(schemas) {
  return (req, _res, next) => {
    const validated = {};
    const issues = [];

    for (const part of ['params', 'query', 'body']) {
      const schema = schemas[part];
      if (!schema) continue;

      const result = schema.safeParse(req[part] ?? {});
      if (result.success) {
        validated[part] = result.data;
      } else {
        for (const issue of result.error.issues) {
          issues.push({ location: part, path: issue.path.join('.'), message: issue.message });
        }
      }
    }

    if (issues.length > 0) {
      const first = issues[0];
      return next(AppError.validation(issues, `Validation failed — ${first.path || first.location}: ${first.message}`));
    }

    req.validated = validated;
    next();
  };
}

module.exports = { validate };
