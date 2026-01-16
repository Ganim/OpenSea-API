import { env } from '@/@env';
import { PrismaClient } from '@prisma/client';

// Usa process.env.DATABASE_URL diretamente para suportar testes E2E
// que modificam a URL antes da importação
const databaseUrl = process.env.DATABASE_URL || env.DATABASE_URL;

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
  log: env.NODE_ENV === 'dev' ? ['query'] : [],
});

// Função para criar um novo client com URL específica (útil para testes)
export function createPrismaClient(url?: string) {
  return new PrismaClient({
    datasources: {
      db: {
        url: url || databaseUrl,
      },
    },
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
