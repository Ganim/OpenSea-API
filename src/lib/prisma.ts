import { env } from '@/@env/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../prisma/generated/prisma/client.js';

// Usa process.env.DATABASE_URL diretamente para suportar testes E2E
// que modificam a URL antes da importação
const databaseUrl = process.env.DATABASE_URL || env.DATABASE_URL;

// PrismaPg (driver adapter) não honra o parâmetro ?schema= da URL.
// Extraímos o schema e passamos explicitamente via option.
function extractSchema(url: string): string | undefined {
  try {
    return new URL(url).searchParams.get('schema') ?? undefined;
  } catch {
    return undefined;
  }
}

const schema = extractSchema(databaseUrl);
const adapter = new PrismaPg({ connectionString: databaseUrl }, schema ? { schema } : undefined);

export const prisma = new PrismaClient({
  adapter,
  log: env.NODE_ENV === 'dev' ? ['query'] : [],
});

// Função para criar um novo client com URL específica (útil para testes)
export function createPrismaClient(url?: string) {
  const clientUrl = url || databaseUrl;
  const clientSchema = extractSchema(clientUrl);
  const testAdapter = new PrismaPg(
    { connectionString: clientUrl },
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

