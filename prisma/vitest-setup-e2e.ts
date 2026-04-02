import { exec } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { promisify } from 'node:util';
import pg from 'pg';

const { Client } = pg;

const execAsync = promisify(exec);

// Load .env file for forked processes (required for JWT_SECRET and other env vars)
process.loadEnvFile();

process.env.NODE_ENV = 'test';
process.env.SILENCE_RATE_LIMIT_LOGS = '1';
console.log(`🧪 Vitest execArgv: ${JSON.stringify(process.execArgv)}`);

// ── Configuration ───────────────────────────────────────────────────────
const TEMPLATE_DB = 'test_e2e_template';
const runId = randomUUID().replace(/-/g, '').substring(0, 12);
const TEST_DB = `test_e2e_${runId}`;

const originalDatabaseUrl =
  process.env.DATABASE_URL ||
  'postgresql://docker:docker@localhost:5432/apiopensea?schema=public';

// Parse connection info from the original URL
const parsedUrl = new URL(originalDatabaseUrl);
const PG_HOST = parsedUrl.hostname;
const PG_PORT = parseInt(parsedUrl.port || '5432', 10);
const PG_USER = decodeURIComponent(parsedUrl.username);
const PG_PASSWORD = decodeURIComponent(parsedUrl.password);
const PG_MAIN_DB = parsedUrl.pathname.replace('/', '');

/** Build a DATABASE_URL pointing to a specific database (always public schema) */
function buildDatabaseUrl(dbName: string): string {
  const encodedUser = encodeURIComponent(PG_USER);
  const encodedPassword = encodeURIComponent(PG_PASSWORD);
  return `postgresql://${encodedUser}:${encodedPassword}@${PG_HOST}:${PG_PORT}/${dbName}?schema=public`;
}

/** Create a raw pg.Client for admin operations (CREATE/DROP DATABASE) */
function createAdminClient(database = PG_MAIN_DB): pg.Client {
  return new Client({
    host: PG_HOST,
    port: PG_PORT,
    user: PG_USER,
    password: PG_PASSWORD,
    database,
  });
}

// ── Step 1: Cleanup orphaned test databases ─────────────────────────────
{
  const client = createAdminClient();
  await client.connect();
  try {
    const { rows } = await client.query<{ datname: string }>(
      `SELECT datname FROM pg_database WHERE datname LIKE 'test_e2e_%' AND datname != $1`,
      [TEMPLATE_DB],
    );

    if (rows.length > 0) {
      console.log(`🧹 Cleaning up ${rows.length} stale test database(s)...`);
      for (const { datname } of rows) {
        // Terminate active connections first
        await client.query(
          `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid != pg_backend_pid()`,
          [datname],
        );
        await client.query(`DROP DATABASE IF EXISTS "${datname}"`);
      }
      console.log(`🧹 Stale databases removed.`);
    }
  } catch (error) {
    console.warn('⚠️ Failed to clean stale test databases:', error);
  } finally {
    await client.end();
  }
}

// ── Step 2: Ensure template database exists and is up-to-date ───────────
{
  const client = createAdminClient();
  await client.connect();

  try {
    // Check if template DB exists
    const { rows } = await client.query<{ datname: string }>(
      `SELECT datname FROM pg_database WHERE datname = $1`,
      [TEMPLATE_DB],
    );

    if (rows.length === 0) {
      console.log(`📦 Creating template database "${TEMPLATE_DB}"...`);
      await client.query(`CREATE DATABASE "${TEMPLATE_DB}"`);
    }
  } finally {
    await client.end();
  }

  // Apply migrations on template DB
  const templateUrl = buildDatabaseUrl(TEMPLATE_DB);
  console.log(`📦 Applying migrations on template...`);

  try {
    await execAsync(`npx prisma migrate deploy`, {
      env: { ...process.env, DATABASE_URL: templateUrl },
      maxBuffer: 1024 * 1024 * 10,
    });
  } catch (error) {
    const stderr = (error as { stderr?: string }).stderr || '';
    if (stderr.includes('already in sync')) {
      console.log(`📦 Template already up-to-date.`);
    } else {
      // If migration fails, drop and recreate template
      console.warn(`⚠️ Migration failed, recreating template...`);
      const client2 = createAdminClient();
      await client2.connect();
      try {
        await client2.query(
          `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid != pg_backend_pid()`,
          [TEMPLATE_DB],
        );
        await client2.query(`DROP DATABASE IF EXISTS "${TEMPLATE_DB}"`);
        await client2.query(`CREATE DATABASE "${TEMPLATE_DB}"`);
      } finally {
        await client2.end();
      }
      // Retry migration
      await execAsync(`npx prisma migrate deploy`, {
        env: { ...process.env, DATABASE_URL: templateUrl },
        maxBuffer: 1024 * 1024 * 10,
      });
    }
  }

  // Seed system user + permissions on template (idempotent)
  {
    const { PrismaClient } = await import('./generated/prisma/client.js');
    const { PrismaPg } = await import('@prisma/adapter-pg');

    const adapter = new PrismaPg({ connectionString: templateUrl });
    const seedClient = new PrismaClient({ adapter });

    try {
      // System user
      await seedClient.user.upsert({
        where: { id: '00000000-0000-0000-0000-000000000000' },
        update: {},
        create: {
          id: '00000000-0000-0000-0000-000000000000',
          email: 'system@system.internal',
          password_hash: 'not-a-real-hash',
        },
      });

      // Permissions + admin-test group
      const { flattenPermissions, ADMIN_TEST_GROUP_SLUG } = await import(
        '../src/utils/tests/e2e-permissions.ts'
      );

      const allPerms = flattenPermissions();
      await seedClient.permission.createMany({
        data: allPerms.map(
          (p: {
            code: string;
            name: string;
            description: string;
            module: string;
            resource: string;
            action: string;
          }) => ({
            ...p,
            isSystem: true,
          }),
        ),
        skipDuplicates: true,
      });

      // Upsert admin group (idempotent for re-runs)
      let adminGroup = await seedClient.permissionGroup.findFirst({
        where: { slug: ADMIN_TEST_GROUP_SLUG, deletedAt: null },
      });

      if (!adminGroup) {
        adminGroup = await seedClient.permissionGroup.create({
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
      }

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
        `🔑 Template seeded: ${allPerms.length} permissions + admin-test group`,
      );
    } finally {
      await seedClient.$disconnect();
    }
  }
}

// ── Step 3: Clone template → test database ──────────────────────────────
{
  const client = createAdminClient();
  await client.connect();
  try {
    // Ensure no connections to template before cloning
    await client.query(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid != pg_backend_pid()`,
      [TEMPLATE_DB],
    );

    const start = Date.now();
    await client.query(
      `CREATE DATABASE "${TEST_DB}" TEMPLATE "${TEMPLATE_DB}"`,
    );
    console.log(
      `🧪 Cloned "${TEMPLATE_DB}" → "${TEST_DB}" in ${Date.now() - start}ms`,
    );
  } finally {
    await client.end();
  }
}

// ── Step 4: Set DATABASE_URL to cloned DB ───────────────────────────────
const testDatabaseUrl = buildDatabaseUrl(TEST_DB);
process.env.DATABASE_URL = testDatabaseUrl;

console.log(`🧪 E2E tests using database: ${TEST_DB}`);

// ── Cleanup ─────────────────────────────────────────────────────────────
// With singleFork: true, the setup top-level runs once but afterAll fires per
// test file. We CANNOT drop the DB here because subsequent test files in the
// same fork still need it. Instead, we rely on orphan cleanup at the start of
// the NEXT run (Step 1) to drop stale test databases.
// This also handles crashes/Ctrl+C gracefully — orphans are always cleaned up.
