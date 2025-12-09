import { env } from '@/@env';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

// Usa process.env.DATABASE_URL diretamente para suportar testes E2E
// que modificam a URL antes da importação
const databaseUrl = process.env.DATABASE_URL || env.DATABASE_URL;

const adapter = new PrismaPg({ connectionString: databaseUrl });

export const prisma = new PrismaClient({
  adapter,
  log: env.NODE_ENV === 'dev' ? ['query'] : [],
});

// Função para criar um novo client com URL específica (útil para testes)
export function createPrismaClient(url?: string) {
  const clientAdapter = new PrismaPg({ connectionString: url || databaseUrl });
  return new PrismaClient({
    adapter: clientAdapter,
    log: env.NODE_ENV === 'dev' ? ['query'] : [],
  });
}
