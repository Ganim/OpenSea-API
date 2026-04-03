import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import pg from 'pg';

const { Client } = pg;

const execAsync = promisify(exec);

// Load .env file for forked processes (required for JWT_SECRET and other env vars)
process.loadEnvFile();

process.env.NODE_ENV = 'test';
process.env.SILENCE_RATE_LIMIT_LOGS = '1';

// ── Configuration ───────────────────────────────────────────────────────
// Use a single persistent test database instead of cloning per-run.
// Cloning was unreliable with Prisma 7 + PrismaPg — the cloned database
// would "disappear" between setup and test execution. Using a single
// persistent DB with data cleanup avoids this entirely.
const TEST_DB = 'test_e2e_persistent';

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

// ── Step 1: Cleanup orphaned test databases (keep persistent one) ────────
{
  const client = createAdminClient();
  await client.connect();
  try {
    const { rows } = await client.query<{ datname: string }>(
      `SELECT datname FROM pg_database WHERE datname LIKE 'test_e2e_%' AND datname != $1`,
      [TEST_DB],
    );

    if (rows.length > 0) {
      console.log(`🧹 Cleaning up ${rows.length} stale test database(s)...`);
      for (const { datname } of rows) {
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

// ── Step 2: Ensure test database exists and is up-to-date ────────────────
{
  const client = createAdminClient();
  await client.connect();

  try {
    const { rows } = await client.query<{ datname: string }>(
      `SELECT datname FROM pg_database WHERE datname = $1`,
      [TEST_DB],
    );

    if (rows.length === 0) {
      console.log(`📦 Creating test database "${TEST_DB}"...`);
      await client.query(`CREATE DATABASE "${TEST_DB}"`);
    }
  } finally {
    await client.end();
  }

  // Sync schema using db push (handles models added after last migration)
  const testUrl = buildDatabaseUrl(TEST_DB);
  console.log(`📦 Syncing schema on "${TEST_DB}"...`);

  try {
    await execAsync(`npx prisma db push --accept-data-loss`, {
      env: { ...process.env, DATABASE_URL: testUrl },
      maxBuffer: 1024 * 1024 * 10,
    });
  } catch (error) {
    const stderr = (error as { stderr?: string }).stderr || '';
    console.error(`⚠️ Schema sync failed:`, stderr);
    throw error;
  }

  // Seed system user + permissions (idempotent)
  {
    const { PrismaClient } = await import('./generated/prisma/client.js');
    const { PrismaPg } = await import('@prisma/adapter-pg');

    // Use explicit config fields — PrismaPg 7.x has issues with connectionString-only config
    const tplParsed = new URL(testUrl);
    const adapter = new PrismaPg({
      host: tplParsed.hostname,
      port: parseInt(tplParsed.port || '5432', 10),
      user: decodeURIComponent(tplParsed.username),
      password: decodeURIComponent(tplParsed.password),
      database: tplParsed.pathname.replace('/', ''),
    });
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
        `🔑 Test DB seeded: ${allPerms.length} permissions + admin-test group`,
      );
    } finally {
      await seedClient.$disconnect();
    }
  }
}

// ── Step 3: Clean test data from previous runs ───────────────────────────
// Truncate all tables except seed tables in a single TRUNCATE ... CASCADE.
// This avoids FK constraint issues without needing superuser privileges.
{
  const client = createAdminClient(TEST_DB);
  await client.connect();
  try {
    // Get all tables except seed/system tables
    const { rows: tables } = await client.query(`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename NOT IN (
          '_prisma_migrations',
          'permissions',
          'permission_groups',
          'permission_group_permissions',
          'users'
        )
    `);

    if (tables.length > 0) {
      const tableList = tables.map((t) => `"${t.tablename}"`).join(', ');
      await client.query(`TRUNCATE TABLE ${tableList} CASCADE`);
    }

    // Clean users separately (keep system user)
    await client.query(
      `DELETE FROM "users" WHERE id != '00000000-0000-0000-0000-000000000000'`,
    );

    console.log(`🧹 Test data cleaned from "${TEST_DB}"`);
  } catch (error) {
    // Non-critical: tests create their own data anyway
    console.warn('⚠️ Failed to clean test data (non-critical):', error);
  } finally {
    await client.end();
  }
}

// ── Step 4: Set DATABASE_URL to test DB ──────────────────────────────────
const testDatabaseUrl = buildDatabaseUrl(TEST_DB);
process.env.DATABASE_URL = testDatabaseUrl;

console.log(`🧪 E2E tests using database: ${TEST_DB}`);
