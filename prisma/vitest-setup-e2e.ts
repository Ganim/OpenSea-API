import { exec } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { promisify } from 'node:util';
import { afterAll } from 'vitest';

const execAsync = promisify(exec);

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

// Cria o schema PostgreSQL antes de aplicar as migrações.
// Prisma 7 com driver adapters não cria o schema automaticamente.
{
  const { PrismaClient } = await import('./generated/prisma/client.js');
  const { PrismaPg } = await import('@prisma/adapter-pg');

  const createSchemaAdapter = new PrismaPg({
    connectionString: originalDatabaseUrl,
  });
  const createSchemaClient = new PrismaClient({ adapter: createSchemaAdapter });

  try {
    await createSchemaClient.$executeRawUnsafe(
      `CREATE SCHEMA IF NOT EXISTS "${schema}"`,
    );
  } finally {
    await createSchemaClient.$disconnect();
  }
}

// Aplica o schema no banco de testes usando `migrate deploy`.
// Prisma 7 com driver adapters tem um bug intermitente (P1014) ao aplicar
// migrações em schemas isolados. A estratégia de retry com recreação do
// schema resolve o problema de forma confiável.
// Com fileParallelism: false os specs rodam sequencialmente, então
// não há contenção do advisory lock do PostgreSQL.
const MAX_MIGRATE_RETRIES = 3;
for (let attempt = 1; attempt <= MAX_MIGRATE_RETRIES; attempt++) {
  try {
    await execAsync(`npx prisma migrate deploy`, {
      env: {
        ...process.env,
        DATABASE_URL: testDatabaseUrl,
      },
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer for large migration output
    });
    break; // Success
  } catch (error) {
    const stderr = (error as { stderr?: string }).stderr || '';
    if (stderr.includes('P1014') && attempt < MAX_MIGRATE_RETRIES) {
      console.warn(
        `⚠️ migrate deploy failed with P1014 (attempt ${attempt}/${MAX_MIGRATE_RETRIES}), retrying...`,
      );
      // Drop and recreate the schema before retrying
      const { PrismaClient } = await import('./generated/prisma/client.js');
      const { PrismaPg } = await import('@prisma/adapter-pg');

      const retryAdapter = new PrismaPg({
        connectionString: originalDatabaseUrl,
      });
      const retryClient = new PrismaClient({ adapter: retryAdapter });
      try {
        await retryClient.$executeRawUnsafe(
          `DROP SCHEMA IF EXISTS "${schema}" CASCADE`,
        );
        await retryClient.$executeRawUnsafe(
          `CREATE SCHEMA IF NOT EXISTS "${schema}"`,
        );
      } finally {
        await retryClient.$disconnect();
      }
      continue;
    }
    throw error; // Non-retryable error or max retries exceeded
  }
}

// Create system user required by EnsureSystemCalendarsUseCase (SYSTEM_USER_ID).
// We force search_path at the PostgreSQL connection level via the `options` parameter
// in pg.PoolConfig to ensure PrismaPg uses the correct schema reliably.
{
  const { PrismaClient } = await import('./generated/prisma/client.js');
  const { PrismaPg } = await import('@prisma/adapter-pg');

  const adapter = new PrismaPg(
    {
      connectionString: testDatabaseUrl,
      options: `-c search_path="${schema}"`,
    },
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

// ── Seed global: permissions + admin-test group ─────────────────────────
// Roda 1x antes de todos os E2E. Evita que cada createAndAuthenticateUser()
// execute ~757 queries por chamada (1.709 chamadas × 757 = 1.3M queries).
{
  const { PrismaClient } = await import('./generated/prisma/client.js');
  const { PrismaPg } = await import('@prisma/adapter-pg');
  // NOTA: vitest-setup-e2e.ts NÃO tem acesso ao alias @/ — usar path relativo
  const { flattenPermissions, ADMIN_TEST_GROUP_SLUG } = await import(
    '../src/utils/tests/e2e-permissions.ts'
  );

  const adapter = new PrismaPg(
    {
      connectionString: testDatabaseUrl,
      options: `-c search_path="${schema}"`,
    },
    { schema },
  );
  const seedClient = new PrismaClient({ adapter });

  try {
    // 1. Create all permissions in one batch
    const allPerms = flattenPermissions();
    await seedClient.permission.createMany({
      data: allPerms.map((p: { code: string; name: string; description: string; module: string; resource: string; action: string }) => ({ ...p, isSystem: true })),
      skipDuplicates: true,
    });

    // 2. Create admin-test group
    const adminGroup = await seedClient.permissionGroup.create({
      data: {
        name: 'Administrador de Testes',
        slug: ADMIN_TEST_GROUP_SLUG,
        description: 'Acesso completo ao sistema para testes E2E',
        isSystem: true,
        isActive: true,
        color: '#DC2626',
        priority: 100,
      },
    });

    // 3. Fetch all permission IDs and associate to admin group in ONE batch
    const permissionIds = await seedClient.permission.findMany({
      select: { id: true },
    });

    await seedClient.permissionGroupPermission.createMany({
      data: permissionIds.map((p: { id: string }) => ({
        groupId: adminGroup.id,
        permissionId: p.id,
        effect: 'allow',
      })),
      skipDuplicates: true,
    });

    console.log(
      `🔑 Seeded ${allPerms.length} permissions + admin-test group (${permissionIds.length} associations)`,
    );
  } finally {
    await seedClient.$disconnect();
  }
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
