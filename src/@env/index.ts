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

  // Notifications module (v2)
  PUBLIC_API_URL: z.string().url().optional(),
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().default('mailto:admin@opensea.app'),
  SMS_NOTIFICATIONS_ENABLED: z
    .string()
    .default('false')
    .transform((v) => v === 'true' || v === '1'),
  WHATSAPP_NOTIFICATIONS_ENABLED: z
    .string()
    .default('false')
    .transform((v) => v === 'true' || v === '1'),
  /**
   * When true, the dispatcher refuses to accept `dispatch()` calls whose
   * `category` is not declared in any registered module manifest (throws
   * UndeclaredCategoryError → 400). Defaults to false so new categories can
   * be introduced without coordinated deploys.
   */
  NOTIFICATIONS_STRICT_MANIFEST: z
    .string()
    .default('false')
    .transform((v) => v === 'true' || v === '1'),

  // JWT RS256 (opcional - se não definido, usa HS256)
  JWT_PRIVATE_KEY: z.string().optional(),
  JWT_PUBLIC_KEY: z.string().optional(),

  // Sentry (opcional)
  SENTRY_DSN: z.string().optional(),

  // Audit HMAC (opcional - deriva de JWT_SECRET se não definido)
  AUDIT_HMAC_SECRET: z.string().optional(),

  // Secret used to salt the respondent hash for anonymous survey submissions
  // (HR P0-02 safety). Kept optional for dev/test; derives from JWT_SECRET at
  // runtime when not set so the hash remains non-reversible by anyone with
  // DB-only access.
  ANON_HASH_SECRET: z.string().optional(),

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

  // eSocial certificate encryption key (optional — derives from JWT_SECRET if not set)
  ESOCIAL_ENCRYPTION_KEY: z.string().min(32).optional(),

  // Pluggy Open Finance
  PLUGGY_CLIENT_ID: z.string().optional(),
  PLUGGY_CLIENT_SECRET: z.string().optional(),

  // Ollama (local AI fallback)
  OLLAMA_HOST: z.string().optional(),

  // BullMQ feature flag — when "true", durable BullMQ-backed schedulers
  // (currently only payment-reconciliation, P3-05) are used instead of the
  // in-process setInterval-based fallback. Disabled by default so the
  // existing scheduler keeps running until production rollout. The Redis
  // connection is shared with the rest of the app (REDIS_HOST/PORT/etc.).
  BULLMQ_ENABLED: z
    .string()
    .default('false')
    .transform((v) => v === 'true' || v === '1'),

  // ============================================================================
  // Phase 6 / Plan 06-01 — Compliance Portaria 671
  // ============================================================================

  /**
   * RECEIPT_HMAC_KEY — chave HMAC para receiptVerifyHash (Plan 06-03).
   *
   * Em produção: OBRIGATÓRIA. 32 bytes base64 (≥44 chars), apenas chars base64
   * válidos. Falha de boot se ausente em production (refine throws).
   *
   * Em dev/test: opcional. Quando ausente, o consumer (06-03 receipt-pdf-worker)
   * emite console.warn loud e usa fallback determinístico
   * 'dev-only-not-for-production-receipt-hmac-key-fallback'. Isto preserva o
   * fluxo de desenvolvimento mas faz com que recibos gerados em dev NÃO sejam
   * válidos em produção (URL de verify de outro ambiente não bate).
   */
  RECEIPT_HMAC_KEY: z
    .string()
    .optional()
    .refine(
      (v) => {
        if (process.env.NODE_ENV === 'production') {
          return !!v && v.length >= 44 && /^[A-Za-z0-9+/=]+$/.test(v);
        }
        return true;
      },
      {
        message:
          'RECEIPT_HMAC_KEY deve ser 32 bytes base64 (44+ chars) em produção',
      },
    ),

  /**
   * ESOCIAL_TP_AMB — ambiente de submissão eSocial S-1200 (Plan 06-05).
   *   1 = Produção (real)
   *   2 = Homologação (default — sandbox sem efeitos legais)
   * Default 2 para que ambientes não-prod não submetam acidentalmente em
   * produção do eSocial.
   */
  ESOCIAL_TP_AMB: z
    .union([z.literal('1'), z.literal('2')])
    .optional()
    .default('2')
    .transform((v) => Number(v) as 1 | 2),

  // ============================================================================
  // Phase 10 / Plan 10-07 — WebAuthn Relying Party (D-G1 fallback)
  // ============================================================================

  /**
   * WEBAUTHN_RP_ID — Relying Party ID (FQDN).
   * Must match the domain origin for all paired PCs in the same tenant.
   * Single RP ID strategy per RESEARCH §Pitfall 4.
   * Dev/test default: 'localhost'
   */
  WEBAUTHN_RP_ID: z.string().min(3).default('localhost'),

  /**
   * WEBAUTHN_ORIGIN — Full origin URL used during WebAuthn ceremony verification.
   * Must match the Electron app origin (usually the API URL for agent calls).
   * Dev/test default: 'http://localhost:3333'
   */
  WEBAUTHN_ORIGIN: z.string().url().default('http://localhost:3333'),

  /**
   * WEBAUTHN_REGISTRATION_TIMEOUT_SEC — Challenge TTL for registration (seconds).
   * Default 300 (5 min). Challenge stored in Redis with this TTL.
   */
  WEBAUTHN_REGISTRATION_TIMEOUT_SEC: z.coerce.number().default(300),
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
