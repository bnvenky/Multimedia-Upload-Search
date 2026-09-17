/**
 * Writes the generated OpenAPI spec to docs/openapi.json (importable into Postman, Insomnia, etc.).
 *
 *   npm run docs:export
 */
const fs = require('node:fs');
const path = require('node:path');

// Documentation generation needs no real database or secrets.
process.env.MONGODB_URI ??= 'mongodb://localhost:27017/unused';
process.env.JWT_ACCESS_SECRET ??= 'documentation-only-secret-not-used-at-runtime';

const { buildOpenApiDocument } = require('../src/docs/openapi');

const outputPath = path.resolve(__dirname, '..', '..', 'docs', 'openapi.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(buildOpenApiDocument(), null, 2)}\n`);

console.log(`OpenAPI spec written to ${path.relative(process.cwd(), outputPath)}`);
