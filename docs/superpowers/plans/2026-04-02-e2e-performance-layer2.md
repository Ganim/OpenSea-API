# E2E Performance — Camada 2: Template Database

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminar o bug P1014 (PrismaPg ignora schema parameter) e reduzir setup time de ~70-100s para ~2-3s usando database-level isolation ao invés de schema-level isolation.

**Architecture:** 
1. Setup cria um **template database** (`test_e2e_template`), aplica migrations + seeds
2. Antes dos testes, clona via `CREATE DATABASE test_e2e_run TEMPLATE test_e2e_template` (~1-2s)
3. `process.env.DATABASE_URL` aponta para o DB clonado (schema=public, sem hacks de search_path)
4. Cleanup dropa o DB clonado

**Tech Stack:** PostgreSQL 16 (CREATE DATABASE ... TEMPLATE), Prisma 7.4, PrismaPg 7.2, Vitest 3.2

---

## Por que isso resolve o P1014

O bug [prisma/prisma#28611](https://github.com/prisma/prisma/issues/28611) faz o PrismaPg **ignorar** o `{ schema }` parameter — todas as queries vão para `public`. Nosso workaround (`-c search_path=...`) é frágil e falha intermitentemente.

Com Template Database, cada teste usa um **database separado** onde `public` é o único schema. Não precisa de search_path, não precisa de `{ schema }` parameter. O bug se torna irrelevante.

---

## Arquivos Envolvidos

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `prisma/vitest-setup-e2e.ts` | **REESCREVER** | Nova lógica: template DB + clone + seed |
| `src/lib/prisma.ts` | **SIMPLIFICAR** | Remover hacks de search_path (não mais necessários) |

**Nenhum teste E2E precisa ser alterado** — o `prisma` singleton recebe a URL via env var antes de ser importado.

---

## Task 1: Reescrever vitest-setup-e2e.ts com Template Database

**Files:**
- Modify: `prisma/vitest-setup-e2e.ts` (reescrita completa)

### Nova Arquitetura

```
┌─────────────────────────────────────────┐
│ Setup (roda 1x por execução)            │
│                                         │
│ 1. Cleanup: drop DBs orphans test_e2e_* │
│ 2. Template existe?                     │
│    SIM → verificar migrations up-to-date│
│    NÃO → CREATE DATABASE template       │
│           → prisma migrate deploy       │
│           → seed system user            │
│           → seed permissions            │
│ 3. Clone: CREATE DATABASE ... TEMPLATE  │
│ 4. Set DATABASE_URL → DB clonado        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ afterAll (cleanup)                      │
│                                         │
│ 1. Disconnect app prisma                │
│ 2. DROP DATABASE test_e2e_<uuid>        │
└─────────────────────────────────────────┘
```

O template DB persiste entre execuções (é recriado apenas quando migrations mudam). Isso elimina o `prisma migrate deploy` de ~60s das execuções subsequentes.

- [ ] **Step 1: Reescrever vitest-setup-e2e.ts**

```typescript
import { exec } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { promisify } from 'node:util';
import { afterAll } from 'vitest';
import pg from 'pg';

const execAsync = promisify(exec);

// Load .env file for forked processes
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
const PG_USER = parsedUrl.username;
const PG_PASSWORD = parsedUrl.password;
const PG_MAIN_DB = parsedUrl.pathname.replace('/', '');

/** Build a DATABASE_URL pointing to a specific database (always public schema) */
function buildDatabaseUrl(dbName: string): string {
  return `postgresql://${PG_USER}:${PG_PASSWORD}@${PG_HOST}:${PG_PORT}/${dbName}?schema=public`;
}

/** Create a raw pg.Client for admin operations (CREATE/DROP DATABASE) */
function createAdminClient(database = PG_MAIN_DB): pg.Client {
  return new pg.Client({
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
      await seedClient.user
        .upsert({
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
        data: allPerms.map((p: { code: string; name: string; description: string; module: string; resource: string; action: string }) => ({
          ...p,
          isSystem: true,
        })),
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
    console.log(`🧪 Cloned "${TEMPLATE_DB}" → "${TEST_DB}" in ${Date.now() - start}ms`);
  } finally {
    await client.end();
  }
}

// ── Step 4: Set DATABASE_URL to cloned DB ───────────────────────────────
const testDatabaseUrl = buildDatabaseUrl(TEST_DB);
process.env.DATABASE_URL = testDatabaseUrl;

console.log(`🧪 E2E tests using database: ${TEST_DB}`);

// ── Cleanup after all tests ─────────────────────────────────────────────
afterAll(async () => {
  // Disconnect app prisma client first
  try {
    const { prisma } = await import('@/lib/prisma');
    await prisma.$disconnect();
  } catch {
    // Ignore
  }

  // Drop the test database
  const client = createAdminClient();
  await client.connect();
  try {
    // Terminate any remaining connections
    await client.query(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid != pg_backend_pid()`,
      [TEST_DB],
    );
    await client.query(`DROP DATABASE IF EXISTS "${TEST_DB}"`);
    console.log(`🧹 Database ${TEST_DB} dropped`);
  } catch (error) {
    console.error(`❌ Failed to drop database ${TEST_DB}:`, error);
  } finally {
    await client.end();
  }
});
```

- [ ] **Step 2: Simplificar prisma.ts — remover search_path hacks**

O `src/lib/prisma.ts` tem lógica complexa para extrair schema e forçar `search_path`. Com database-level isolation, tudo usa `public` schema. Simplificar para:

```typescript
import { env } from '@/@env/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../prisma/generated/prisma/client.js';

const databaseUrl = process.env.DATABASE_URL || env.DATABASE_URL;

const adapter = new PrismaPg({ connectionString: databaseUrl });

export const prisma = new PrismaClient({
  adapter,
  log: env.NODE_ENV === 'dev' ? ['query'] : [],
});

export function createPrismaClient(url?: string) {
  const clientUrl = url || databaseUrl;
  const testAdapter = new PrismaPg({ connectionString: clientUrl });

  return new PrismaClient({
    adapter: testAdapter,
    log: env.NODE_ENV === 'dev' ? ['query'] : [],
  });
}

export async function checkDatabaseHealth(): Promise<{
  status: 'up' | 'down';
  latency?: number;
  error?: string;
}> {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'up', latency: Date.now() - start };
  } catch (error) {
    return {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown database error',
    };
  }
}

export { Prisma } from '../../prisma/generated/prisma/client.js';
```

- [ ] **Step 3: Verificar que `pg` está nas dependências**

Run: `cd D:/Code/Projetos/OpenSea/OpenSea-API && grep '"pg"' package.json`

Expected: `"pg": "8.13.1"` (já está, usado pelo PrismaPg)

- [ ] **Step 4: Testar com health E2E**

Run: `npx vitest run --config vitest.e2e.config.ts src/http/controllers/health/`

Expected: PASS, log mostra "Cloned template → test DB in Xms"

- [ ] **Step 5: Testar com audit E2E (falhava com P1014)**

Run: `npx vitest run --config vitest.e2e.config.ts src/http/controllers/audit/`

Expected: 4/4 PASS (antes era 3/4 com P1014 failure)

- [ ] **Step 6: Testar com requests E2E**

Run: `npx vitest run --config vitest.e2e.config.ts src/http/controllers/requests/`

Expected: 9/9 PASS (antes era 8/9 com P1014 failure)

- [ ] **Step 7: Testar com stock products (antes crashava com OOM)**

Run: `npx vitest run --config vitest.e2e.config.ts src/http/controllers/stock/products/`

Expected: PASS sem OOM

- [ ] **Step 8: Medir tempo comparativo**

Comparar:
- Setup time (template creation vs migrate deploy)
- Clone time 
- Total test time

- [ ] **Step 9: Commit**

```bash
git add prisma/vitest-setup-e2e.ts src/lib/prisma.ts
git commit -m "perf(e2e): replace schema isolation with template database — eliminates P1014"
```

---

## Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| `pg` module import não funciona no setup | Já é dependência do projeto (pg 8.13.1) |
| Template DB tem conexões ativas durante clone | `pg_terminate_backend()` antes do clone |
| Crash sem cleanup | Cleanup de orphans no início do setup |
| PostgreSQL user sem CREATEDB | Docker user `docker` é superuser |
| Template desatualizado após nova migration | `prisma migrate deploy` é idempotente no template |
| Segunda execução rápida (template já existe) | migrate deploy detecta "already in sync" |

## Impacto Esperado

| Métrica | Antes (Schema) | Depois (Template DB) |
|---------|----------------|---------------------|
| Bug P1014 | Intermitente | **Eliminado** |
| Setup (1ª execução) | ~70-100s (migrate) | ~70-100s (create template + migrate) |
| Setup (2ª+ execução) | ~70-100s (migrate) | **~2-3s** (clone) |
| search_path hacks | Sim (frágil) | **Nenhum** |
| Paralelismo futuro | Impossível (schema compartilhado) | **Possível** (cada worker = DB separado) |
