import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { promisify } from 'node:util';
import { afterAll } from 'vitest';

const execFileAsync = promisify(execFile);

// Load .env file for forked processes (required for JWT_SECRET and other env vars)
process.loadEnvFile();

process.env.NODE_ENV = 'test';
process.env.SILENCE_RATE_LIMIT_LOGS = '1';
console.log(`🧪 Vitest execArgv: ${JSON.stringify(process.execArgv)}`);

// Gera schema único ANTES de qualquer importação do app
const schema = `test_${randomUUID().replace(/-/g, '_')}`;

// Salva a URL original ANTES de sobrescrever
const originalDatabaseUrl =
  process.env.DATABASE_URL ||
  'postgresql://docker:docker@localhost:5432/apiopensea?schema=public';

function generateDatabaseUrl(schemaName: string) {
  const url = new URL(originalDatabaseUrl);
  url.searchParams.set('schema', schemaName);
  return url.toString();
}

// Define a URL do banco ANTES de importar qualquer módulo do app
const testDatabaseUrl = generateDatabaseUrl(schema);
process.env.DATABASE_URL = testDatabaseUrl;

// Clean up stale test schemas from previous interrupted runs.
// When tests are killed (Ctrl+C, timeout), afterAll never runs and schemas leak.
// This prevents accumulation that degrades PostgreSQL performance.
{
  const { PrismaClient } = await import('./generated/prisma/client.js');
  const { PrismaPg } = await import('@prisma/adapter-pg');

  const cleanupAdapter = new PrismaPg({
    connectionString: originalDatabaseUrl,
  });
  const cleanupClient = new PrismaClient({ adapter: cleanupAdapter });

  try {
    const staleSchemas: Array<{ nspname: string }> =
      await cleanupClient.$queryRaw`
        SELECT nspname FROM pg_namespace
        WHERE nspname LIKE 'test_%'
        AND nspname != ${schema}
        ORDER BY nspname
      `;

    if (staleSchemas.length > 0) {
      console.log(
        `🧹 Cleaning up ${staleSchemas.length} stale test schema(s)...`,
      );
      for (const { nspname } of staleSchemas) {
        await cleanupClient.$executeRawUnsafe(
          `DROP SCHEMA IF EXISTS "${nspname}" CASCADE`,
        );
      }
      console.log(`🧹 Stale schemas removed.`);
    }
  } catch (error) {
    // Non-fatal: if cleanup fails, continue with the test run
    console.warn('⚠️ Failed to clean stale test schemas:', error);
  } finally {
    await cleanupClient.$disconnect();
  }
}

// Aplica o schema no banco de testes usando `migrate deploy`.
// Com fileParallelism: false os specs rodam sequencialmente, então
// não há contenção do advisory lock do PostgreSQL.
await execFileAsync('npx', ['prisma', 'migrate', 'deploy'], {
  env: {
    ...process.env,
    DATABASE_URL: testDatabaseUrl,
  },
  shell: true,
});

// Create system user required by EnsureSystemCalendarsUseCase (SYSTEM_USER_ID)
{
  const { PrismaClient } = await import('./generated/prisma/client.js');
  const { PrismaPg } = await import('@prisma/adapter-pg');

  const adapter = new PrismaPg(
    { connectionString: testDatabaseUrl },
    { schema },
  );
  const setupClient = new PrismaClient({ adapter });

  await setupClient.user
    .create({
      data: {
        id: '00000000-0000-0000-0000-000000000000',
        email: 'system@system.internal',
        password_hash: 'not-a-real-hash',
      },
    })
    .catch(() => {
      // Ignore if already exists
    });

  await setupClient.$disconnect();
}

console.log(`🧪 Testes E2E usando schema: ${schema}`);

// Cleanup após todos os testes
afterAll(async () => {
  // Desconecta o client do app primeiro
  try {
    const { prisma } = await import('@/lib/prisma');
    await prisma.$disconnect();
  } catch {
    // ignora se não conseguir desconectar
  }

  // Usa conexão separada no schema público para dropar o schema de teste
  const { PrismaClient } = await import('./generated/prisma/client.js');
  const { PrismaPg } = await import('@prisma/adapter-pg');

  const adapter = new PrismaPg({ connectionString: originalDatabaseUrl });
  const cleanupClient = new PrismaClient({ adapter });

  try {
    await cleanupClient.$executeRawUnsafe(
      `DROP SCHEMA IF EXISTS "${schema}" CASCADE`,
    );
    console.log(`🧹 Schema ${schema} removido com sucesso`);
  } catch (error) {
    console.error(`❌ Erro ao remover schema ${schema}:`, error);
  } finally {
    await cleanupClient.$disconnect();
  }
});
