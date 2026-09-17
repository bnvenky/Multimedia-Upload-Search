// Tests configure the environment themselves and must never read a developer's real .env file.
if (process.env.NODE_ENV !== 'test') {
  require('dotenv').config({ quiet: true });
}

const { z } = require('zod');

/**
 * Environment variables are validated once at startup. If something is missing or wrong
 * the app stops immediately with a clear message instead of failing later at runtime.
 */
const booleanFlag = z.enum(['true', 'false', '1', '0']).transform((value) => value === 'true' || value === '1');

const commaSeparatedList = z.string().transform((value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean),
);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),

  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  MONGODB_DB_NAME: z.string().min(1).default('multimedia_search'),

  CLOUDINARY_URL: z
    .string()
    .regex(/^cloudinary:\/\/[^:]+:[^@]+@.+$/, 'CLOUDINARY_URL must look like cloudinary://key:secret@cloud')
    .optional(),
  CLOUDINARY_FOLDER: z.string().min(1).default('multimedia-search'),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  JWT_ISSUER: z.string().default('multimedia-search-api'),
  JWT_AUDIENCE: z.string().default('multimedia-search-client'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),

  CLIENT_ORIGINS: commaSeparatedList.default(['http://localhost:5173']),
  COOKIE_SECURE: booleanFlag.optional(),
  COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),

  MAX_UPLOAD_MB: z.coerce.number().positive().max(500).default(100),

  SERVE_CLIENT: booleanFlag.default(false),
  CLIENT_DIST_PATH: z.string().default('../frontend/dist'),
});

function loadEnv() {
  // Blank values (e.g. "PORT=" in a hosting dashboard) count as "not set", so defaults apply.
  const definedValues = Object.fromEntries(Object.entries(process.env).filter(([, value]) => value !== ''));
  const parsed = envSchema.safeParse(definedValues);
  if (!parsed.success) {
    const report = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${report}`);
  }

  const env = parsed.data;
  if (env.COOKIE_SAME_SITE === 'none' && env.COOKIE_SECURE === false) {
    throw new Error('Invalid environment configuration: COOKIE_SAME_SITE=none requires COOKIE_SECURE=true');
  }
  return env;
}

const env = loadEnv();
const isProduction = env.NODE_ENV === 'production';
const isTest = env.NODE_ENV === 'test';
// SameSite=None cookies are only accepted by browsers when they are also Secure.
const cookieSecure = env.COOKIE_SECURE ?? (isProduction || env.COOKIE_SAME_SITE === 'none');

module.exports = { env, isProduction, isTest, cookieSecure };
