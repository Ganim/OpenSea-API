import { env } from '@/@env/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { PrismaClient } from '../../prisma/generated/prisma/client.js';

// Usa process.env.DATABASE_URL diretamente para suportar testes E2E
// que modificam a URL antes da importação
const databaseUrl = process.env.DATABASE_URL || env.DATABASE_URL;

/**
 * Create a PrismaPg adapter from a connection URL.
 * Uses an explicit pg.Pool to avoid Prisma 7 + PrismaPg adapter issues
 * where passing config objects fails to resolve the database name.
 */
function createAdapter(url: string) {
  const pool = new pg.Pool({ connectionString: url });
  return new PrismaPg(pool);
}

const adapter = createAdapter(databaseUrl);

export const prisma = new PrismaClient({
  adapter,
  log: env.NODE_ENV === 'dev' ? ['query'] : [],
});

// Função para criar um novo client com URL específica (útil para testes)
export function createPrismaClient(url?: string) {
  const clientUrl = url || databaseUrl;
  const testAdapter = createAdapter(clientUrl);

  return new PrismaClient({
    adapter: testAdapter,
    log: env.NODE_ENV === 'dev' ? ['query'] : [],
  });
}

// Health check para o banco de dados
export async function checkDatabaseHealth(): Promise<{
  status: 'up' | 'down';
  latency?: number;
  error?: string;
}> {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;

    return { status: 'up', latency };
  } catch (error) {
    return {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown database error',
    };
  }
}

// Re-export tipos do Prisma para facilitar imports em outros arquivos
export { Prisma } from '../../prisma/generated/prisma/client.js';
