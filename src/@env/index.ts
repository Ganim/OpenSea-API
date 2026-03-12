import z from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['dev', 'test', 'staging', 'production']).default('dev'),
  JWT_SECRET: z.string(),
  DATABASE_URL: z.url(),
  PORT: z.coerce.number().default(3333),

  // Redis configuration
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().default(0),
  REDIS_TLS: z
    .string()
    .default('false')
    .transform((v) => v === 'true' || v === '1'),

  // SMTP configuration
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().default('user'),
  SMTP_PASS: z.string().default('pass'),

  // Frontend
  FRONTEND_URL: z.url().default('http://localhost:3000'),


  // JWT RS256 (opcional - se não definido, usa HS256)
  JWT_PRIVATE_KEY: z.string().optional(),
  JWT_PUBLIC_KEY: z.string().optional(),

  // Sentry (opcional)
  SENTRY_DSN: z.string().optional(),

  // Audit HMAC (opcional - deriva de JWT_SECRET se não definido)
  AUDIT_HMAC_SECRET: z.string().optional(),

  // S3/R2 Storage (opcional - usa local storage se não configurado)
  S3_ENDPOINT: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_BUCKET: z.string().default('opensea-attachments'),
  S3_REGION: z.string().default('auto'),

  // Storage encryption (AES-256-GCM) — 256-bit key, hex-encoded (64 hex chars)
  STORAGE_ENCRYPTION_KEY: z.string().length(64).optional(),

  // Field-level encryption (AES-256-GCM) for PII/sensitive data
  FIELD_ENCRYPTION_KEY: z.string().length(64).optional(),
  FIELD_HMAC_KEY: z.string().min(16).optional(),

  // Email account credentials encryption (AES-GCM)
  EMAIL_CREDENTIALS_KEY: z.string().min(32).optional(),
  // Previous key for zero-downtime key rotation
  EMAIL_CREDENTIALS_KEY_PREVIOUS: z.string().min(32).optional(),
});

const _env = envSchema.safeParse(process.env);
if (!_env.success) {
  // Using console.error here is acceptable as logger is not yet initialized
  // and this is a critical startup error that should be visible immediately
  console.error(
    '⚠️  Invalid environment variables:',
    z.treeifyError(_env.error),
  );
  throw new Error('Invalid environment variables');
}

export const env = _env.data;
