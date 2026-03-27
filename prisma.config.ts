import { defineConfig } from 'prisma/config';

// Carrega .env usando API nativa do Node.js (não sobrescreve vars existentes)
try {
  process.loadEnvFile();
} catch {
  // .env file not found; environment variables are expected to be set externally
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    seed: 'npx tsx --env-file=.env prisma/seed.ts',
  },
});
