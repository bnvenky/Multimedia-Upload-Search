const { z } = require('../utils/zod');

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.email('Must be a valid email address'))
  .openapi({ example: 'ada@example.com' });

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/\d/, 'Password must contain at least one number')
  // bcrypt only uses the first 72 bytes, so longer passwords are rejected instead of silently cut.
  .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Password must be at most 72 bytes')
  .openapi({ example: 'Sup3rSecret!' });

const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60).openapi({ example: 'Ada Lovelace' }),
    email: emailSchema,
    password: passwordSchema,
  })
  .strict()
  .openapi('RegisterRequest');

const loginSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required').max(128).openapi({ example: 'Sup3rSecret!' }),
  })
  .strict()
  .openapi('LoginRequest');

const publicUserSchema = z
  .object({
    id: z.string().openapi({ example: '66f1c2a4b7e4a1d2c3b4a5f6' }),
    name: z.string(),
    email: z.string(),
    role: z.enum(['user', 'admin']),
    createdAt: z.string().openapi({ format: 'date-time' }),
    lastLoginAt: z.string().nullable().openapi({ format: 'date-time' }),
  })
  .openapi('User');

const authResponseSchema = z
  .object({
    user: publicUserSchema,
    accessToken: z.string().openapi({ description: 'JWT access token. Send as `Authorization: Bearer <token>`.' }),
    tokenType: z.literal('Bearer'),
    expiresIn: z.number().openapi({ description: 'Access token lifetime in seconds', example: 900 }),
  })
  .openapi('AuthSession');

module.exports = { registerSchema, loginSchema, publicUserSchema, authResponseSchema };
