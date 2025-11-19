import 'dotenv/config';
import z from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['dev', 'test', 'production']).default('dev'),
  JWT_SECRET: z.string().default('test-jwt-secret-key'),
  DATABASE_URL: z
    .url()
    .default(
      'postgresql://docker:docker@localhost:5432/opensea-db?schema=public',
    ),
  PORT: z.coerce.number().default(3333),
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().default('user'),
  SMTP_PASS: z.string().default('pass'),
  FRONTEND_URL: z.url().default('http://localhost:3000'),
  NOTIFICATIONS_CRON_INTERVAL_MS: z.coerce.number().default(60000),
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
