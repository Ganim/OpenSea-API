import { defineConfig } from 'prisma/config';

// Carrega .env usando API nativa do Node.js (não sobrescreve vars existentes)
try { process.loadEnvFile(); } catch {}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
