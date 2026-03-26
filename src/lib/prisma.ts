import { env } from '@/@env/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../prisma/generated/prisma/client.js';

// Usa process.env.DATABASE_URL diretamente para suportar testes E2E
// que modificam a URL antes da importação
const databaseUrl = process.env.DATABASE_URL || env.DATABASE_URL;

// PrismaPg (driver adapter) uses the { schema } option only in getConnectionInfo()
// to tell Prisma's query engine which schema to reference in generated SQL.
// However, it does NOT set PostgreSQL's search_path on the actual connections.
// This causes intermittent failures when PostgreSQL resolves unqualified names
// (sequences, functions, some internal queries) against the 'public' schema.
//
// Fix: We pass `options: '-c search_path=...'` in the pg.PoolConfig so that
// every new PostgreSQL connection sets search_path at the protocol level during
// connection startup. This is the most reliable approach because PostgreSQL
// handles it before any queries are executed.
function extractSchema(url: string): string | undefined {
  try {
    return new URL(url).searchParams.get('schema') ?? undefined;
  } catch {
    return undefined;
  }
}

function buildPoolConfig(
  url: string,
  schemaName: string | undefined,
): { connectionString: string; options?: string } {
  const config: { connectionString: string; options?: string } = {
    connectionString: url,
  };

  // Force search_path at the PostgreSQL connection level so all connections
  // in the pool use the correct schema, regardless of PrismaPg behavior.
  if (schemaName && schemaName !== 'public') {
    config.options = `-c search_path="${schemaName}"`;
  }

  return config;
}

const schema = extractSchema(databaseUrl);
const adapter = new PrismaPg(
  buildPoolConfig(databaseUrl, schema),
  schema ? { schema } : undefined,
);

export const prisma = new PrismaClient({
  adapter,
  log: env.NODE_ENV === 'dev' ? ['query'] : [],
});

// Função para criar um novo client com URL específica (útil para testes)
export function createPrismaClient(url?: string) {
  const clientUrl = url || databaseUrl;
  const clientSchema = extractSchema(clientUrl);
  const testAdapter = new PrismaPg(
    buildPoolConfig(clientUrl, clientSchema),
    clientSchema ? { schema: clientSchema } : undefined,
  );

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
