# E2E Performance — Camada 1: Seed Global de Permissões

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduzir o tempo de execução dos testes E2E de ~6 horas para ~15-20 minutos eliminando 1.293.713 queries redundantes de setup de permissões.

**Architecture:** Mover a criação de permissões e do grupo admin-test para o `vitest-setup-e2e.ts` (executa 1x antes de todos os testes). A factory `createAndAuthenticateUser` passa a apenas associar o userId ao grupo pré-existente (1-2 queries ao invés de 757).

**Tech Stack:** Vitest 3.2.4, Prisma 7.4.0, @prisma/adapter-pg 7.2.0, PostgreSQL 16, Fastify

---

## Contexto e Diagnóstico

### O Problema

`setupAllPermissions()` é chamada **1.709 vezes** durante a suite E2E. Cada chamada executa:
- 1× `createMany` (752 permissões com `skipDuplicates`) → ~50ms
- 1× `findFirst` (admin group) → ~5ms
- 1× `create` (admin group, se não existir) → ~5ms
- 1× `findMany` (todas as 752 permissões) → ~10ms
- **752× `upsert` individuais** (assignar cada permissão ao grupo) → ~2-5s
- 1× `upsert` (assignar user ao grupo) → ~5ms

**Total: ~757 queries por chamada × 1.709 chamadas = ~1.293.713 queries DB**

### A Solução

Seedar permissões + admin group + associações **1 vez** no setup global. Cada `createAndAuthenticateUser()` reduz de 757 para 2 queries.

### Arquivos Envolvidos

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `prisma/vitest-setup-e2e.ts` | MODIFICAR | Adicionar seed de permissões + admin group após migrate |
| `src/utils/tests/factories/core/create-and-authenticate-user.e2e.ts` | MODIFICAR | Simplificar `setupAllPermissions()` e `setupSpecificPermissions()` |

**Nenhum teste E2E precisa ser alterado** — a interface pública das factories permanece idêntica.

---

## Task 1: Criar função de seed global no vitest-setup-e2e.ts

**Files:**
- Modify: `prisma/vitest-setup-e2e.ts:140-169` (após criar system user, antes do console.log final)

A ideia é adicionar um bloco que:
1. Cria todas as 752 permissões via `createMany` com `skipDuplicates`
2. Cria o grupo `admin-test` 
3. Associa TODAS as permissões ao grupo via `createMany` (1 query batch, não 752 upserts)

- [ ] **Step 1: Adicionar import do ALL_PERMISSIONS no topo do seed**

No `prisma/vitest-setup-e2e.ts`, após o bloco que cria o system user (linhas 143-169), adicionar um novo bloco de seed.

O `ALL_PERMISSIONS` precisa ser extraído para um arquivo compartilhado. Criar:

`src/utils/tests/e2e-permissions.ts` com a constante `ALL_PERMISSIONS` (movida de `create-and-authenticate-user.e2e.ts`) e as funções helper `generatePermissionCode` e `generatePermissionName`.

```typescript
// src/utils/tests/e2e-permissions.ts

/**
 * All permissions for E2E tests — single source of truth.
 * Used by vitest-setup-e2e.ts (seed) and create-and-authenticate-user.e2e.ts (specific perms).
 */
export const ALL_PERMISSIONS: Record<string, Record<string, string[]>> = {
  // ... (mover a constante inteira de create-and-authenticate-user.e2e.ts)
};

export function generatePermissionCode(
  module: string,
  resource: string,
  action: string,
): string {
  return `${module}.${resource}.${action}`;
}

export function generatePermissionName(
  module: string,
  resource: string,
  action: string,
): string {
  // ... (mover a função inteira de create-and-authenticate-user.e2e.ts)
}

/**
 * Flatten ALL_PERMISSIONS into an array of { code, name, description, module, resource, action }
 */
export function flattenPermissions(): Array<{
  code: string;
  name: string;
  description: string;
  module: string;
  resource: string;
  action: string;
}> {
  const result: Array<{
    code: string;
    name: string;
    description: string;
    module: string;
    resource: string;
    action: string;
  }> = [];

  for (const [module, resources] of Object.entries(ALL_PERMISSIONS)) {
    for (const [resource, actions] of Object.entries(resources)) {
      for (const action of actions) {
        const code = generatePermissionCode(module, resource, action);
        const name = generatePermissionName(module, resource, action);
        result.push({
          code,
          name,
          description: `Permissão para ${name.toLowerCase()} no módulo ${module}`,
          module,
          resource,
          action,
        });
      }
    }
  }

  return result;
}

/** Slug used for the global admin group in E2E tests */
export const ADMIN_TEST_GROUP_SLUG = 'admin-test';
```

- [ ] **Step 2: Adicionar seed de permissões no vitest-setup-e2e.ts**

No `prisma/vitest-setup-e2e.ts`, APÓS o bloco que cria o system user (linha ~169) e ANTES do `console.log` final (linha ~171), adicionar:

```typescript
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
    // 1. Create all 752 permissions in one batch
    const allPerms = flattenPermissions();
    await seedClient.permission.createMany({
      data: allPerms.map((p) => ({ ...p, isSystem: true })),
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
      data: permissionIds.map((p) => ({
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
```

**Queries totais deste seed: 4** (createMany + create + findMany + createMany). Roda 1x.

- [ ] **Step 3: Verificar que o seed roda sem erros**

Run: `cd D:/Code/Projetos/OpenSea/OpenSea-API && npx vitest run --config vitest.e2e.config.ts --bail 1 src/http/controllers/health/ 2>&1 | tail -20`

Expected: Health check E2E passa, log mostra "🔑 Seeded 752 permissions + admin-test group"

- [ ] **Step 4: Commit**

```bash
cd D:/Code/Projetos/OpenSea/OpenSea-API
git add src/utils/tests/e2e-permissions.ts prisma/vitest-setup-e2e.ts
git commit -m "perf(e2e): extract permissions to shared module and seed in global setup"
```

---

## Task 2: Simplificar setupAllPermissions() na factory

**Files:**
- Modify: `src/utils/tests/factories/core/create-and-authenticate-user.e2e.ts`

Substituir `setupAllPermissions()` (757 queries) por uma versão que apenas associa o user ao grupo pré-existente (1-2 queries).

- [ ] **Step 1: Remover ALL_PERMISSIONS, helpers, e simplificar**

No arquivo `src/utils/tests/factories/core/create-and-authenticate-user.e2e.ts`:

**A) Remover** toda a constante `ALL_PERMISSIONS` (linhas 8-795) — agora está em `e2e-permissions.ts`

**B) Remover** as funções `generatePermissionCode()` e `generatePermissionName()` — agora estão em `e2e-permissions.ts`

**C) Adicionar import** no topo:

```typescript
import {
  ADMIN_TEST_GROUP_SLUG,
  generatePermissionCode,
  generatePermissionName,
} from '@/utils/tests/e2e-permissions';
```

**D) Substituir** `setupAllPermissions()` por:

```typescript
/**
 * Assigns user to the pre-seeded admin-test group.
 * Permissions and admin group are seeded once in vitest-setup-e2e.ts.
 * This reduces from ~757 queries to 2 queries per user.
 */
async function setupAllPermissions(userId: string): Promise<void> {
  // Find the admin group seeded by vitest-setup-e2e.ts
  const adminGroup = await prisma.permissionGroup.findFirst({
    where: { slug: ADMIN_TEST_GROUP_SLUG, deletedAt: null },
  });

  if (!adminGroup) {
    throw new Error(
      `Admin test group "${ADMIN_TEST_GROUP_SLUG}" not found. ` +
        'Ensure vitest-setup-e2e.ts ran the permission seed.',
    );
  }

  // Assign user to admin group (1 query)
  await prisma.userPermissionGroup.upsert({
    where: {
      userId_groupId: {
        userId,
        groupId: adminGroup.id,
      },
    },
    update: {},
    create: {
      userId,
      groupId: adminGroup.id,
    },
  });
}
```

**E) Simplificar** `setupSpecificPermissions()`:

As permissões já existem no banco (seedadas globalmente), então não precisa mais criá-las. Simplificar para:

```typescript
/**
 * Creates a specific permission group for this user with only the given permissions.
 * Permissions already exist in DB (seeded globally), so just find and assign.
 */
async function setupSpecificPermissions(
  userId: string,
  permissionCodes: string[],
): Promise<void> {
  if (permissionCodes.length === 0) {
    return; // No permissions — user will get 403
  }

  // Ensure the specific permissions exist (some tests use codes not in ALL_PERMISSIONS)
  for (const code of permissionCodes) {
    const parts = code.split('.');
    const module = parts[0];
    const resource = parts.slice(1, -1).join('.');
    const action = parts[parts.length - 1];
    const name = generatePermissionName(module, resource, action);

    await prisma.permission.upsert({
      where: { code },
      update: {},
      create: {
        code,
        name,
        description: `Permissão para ${name.toLowerCase()} no módulo ${module}`,
        module,
        resource,
        action,
        isSystem: true,
      },
    });
  }

  // Create a unique group for this user's specific permissions
  const groupSlug = `test-specific-${userId.substring(0, 8)}`;

  const testGroup = await prisma.permissionGroup.create({
    data: {
      name: `Grupo de Teste ${userId.substring(0, 8)}`,
      slug: groupSlug,
      description: 'Grupo com permissões específicas para teste E2E',
      isSystem: true,
      isActive: true,
      color: '#3B82F6',
      priority: 50,
    },
  });

  // Find permission IDs and assign in batch
  const permissions = await prisma.permission.findMany({
    where: { code: { in: permissionCodes } },
    select: { id: true },
  });

  if (permissions.length > 0) {
    await prisma.permissionGroupPermission.createMany({
      data: permissions.map((p) => ({
        groupId: testGroup.id,
        permissionId: p.id,
        effect: 'allow' as const,
      })),
      skipDuplicates: true,
    });
  }

  await prisma.userPermissionGroup.create({
    data: {
      userId,
      groupId: testGroup.id,
    },
  });
}
```

Mudanças chave em `setupSpecificPermissions`:
- Permissões base já existem, mas mantém `upsert` para permissões fora do `ALL_PERMISSIONS`
- Associações usam `createMany` (1 batch) ao invés de 752 `upsert` individuais
- Grupo usa `create` direto (slug é único por userId)

- [ ] **Step 2: Verificar que os testes do health continuam passando**

Run: `cd D:/Code/Projetos/OpenSea/OpenSea-API && npx vitest run --config vitest.e2e.config.ts --bail 1 src/http/controllers/health/ 2>&1 | tail -10`

Expected: PASS

- [ ] **Step 3: Rodar um módulo completo para validar (stock products — tem muitos users)**

Run: `cd D:/Code/Projetos/OpenSea/OpenSea-API && npx vitest run --config vitest.e2e.config.ts src/http/controllers/stock/products/ 2>&1 | tail -15`

Expected: Todos os testes de products passam. Log mostra o seed no início.

- [ ] **Step 4: Rodar testes que usam `permissions: []` (403 tests)**

Run: `cd D:/Code/Projetos/OpenSea/OpenSea-API && npx vitest run --config vitest.e2e.config.ts src/http/controllers/calendar/events/v1-create-calendar-event.e2e.spec.ts 2>&1 | tail -15`

Expected: PASS (teste de 403 funciona porque user sem grupo não tem permissões)

- [ ] **Step 5: Rodar testes que usam permissões específicas**

Run: `cd D:/Code/Projetos/OpenSea/OpenSea-API && npx vitest run --config vitest.e2e.config.ts src/http/controllers/email/accounts/v1-email-accounts.e2e.spec.ts 2>&1 | tail -15`

Expected: PASS (teste com permissões específicas funciona)

- [ ] **Step 6: Commit**

```bash
cd D:/Code/Projetos/OpenSea/OpenSea-API
git add src/utils/tests/factories/core/create-and-authenticate-user.e2e.ts
git commit -m "perf(e2e): reduce auth factory from 757 to 2 queries per user"
```

---

## Task 3: Adicionar cache do adminGroupId em memória

**Files:**
- Modify: `src/utils/tests/factories/core/create-and-authenticate-user.e2e.ts`

O `findFirst` para buscar o admin group é feito a cada chamada (1.709 vezes). Podemos cachear o ID em memória.

- [ ] **Step 1: Adicionar cache no módulo**

No topo do arquivo (após imports), adicionar:

```typescript
/** Cached admin group ID — avoids 1 findFirst per createAndAuthenticateUser call */
let cachedAdminGroupId: string | null = null;
```

Modificar `setupAllPermissions`:

```typescript
async function setupAllPermissions(userId: string): Promise<void> {
  if (!cachedAdminGroupId) {
    const adminGroup = await prisma.permissionGroup.findFirst({
      where: { slug: ADMIN_TEST_GROUP_SLUG, deletedAt: null },
    });

    if (!adminGroup) {
      throw new Error(
        `Admin test group "${ADMIN_TEST_GROUP_SLUG}" not found. ` +
          'Ensure vitest-setup-e2e.ts ran the permission seed.',
      );
    }

    cachedAdminGroupId = adminGroup.id;
  }

  await prisma.userPermissionGroup.upsert({
    where: {
      userId_groupId: {
        userId,
        groupId: cachedAdminGroupId,
      },
    },
    update: {},
    create: {
      userId,
      groupId: cachedAdminGroupId,
    },
  });
}
```

**Resultado:** A partir da 2ª chamada, é 1 query (upsert) ao invés de 2 (findFirst + upsert).

- [ ] **Step 2: Rodar testes de health para validar**

Run: `cd D:/Code/Projetos/OpenSea/OpenSea-API && npx vitest run --config vitest.e2e.config.ts src/http/controllers/health/ 2>&1 | tail -10`

Expected: PASS

- [ ] **Step 3: Commit**

```bash
cd D:/Code/Projetos/OpenSea/OpenSea-API
git add src/utils/tests/factories/core/create-and-authenticate-user.e2e.ts
git commit -m "perf(e2e): cache admin group ID in memory across test files"
```

---

## Task 4: Criar documentação E2E e guia para agentes

**Files:**
- Create: `docs/guides/e2e-testing.md`

Documentação que serve tanto para desenvolvedores quanto para agentes AI criarem testes E2E corretos.

- [ ] **Step 1: Escrever o guia**

```markdown
# Guia de Testes E2E — OpenSea-API

## Arquitetura

### Setup Global (roda 1x antes de todos os E2E)

O arquivo `prisma/vitest-setup-e2e.ts` executa antes de qualquer teste:

1. Cria schema PostgreSQL isolado (`test_<uuid>`)
2. Aplica todas as migrations (`prisma migrate deploy`)
3. Cria o system user (SYSTEM_USER_ID)
4. **Seeda 752 permissões + grupo admin-test com todas as associações**
5. Limpa o schema no `afterAll`

### Factories Disponíveis

| Factory | Arquivo | Uso |
|---------|---------|-----|
| `createAndSetupTenant()` | `src/utils/tests/factories/core/create-and-setup-tenant.e2e.ts` | Cria tenant + plan. Chamar 1x no `beforeAll`. |
| `createAndAuthenticateUser(app, opts)` | `src/utils/tests/factories/core/create-and-authenticate-user.e2e.ts` | Cria user + auth. Retorna `{ token, user, refreshToken }` |
| `createAndAuthenticateSuperAdmin(app)` | `src/utils/tests/factories/core/create-and-authenticate-super-admin.e2e.ts` | Cria super admin para rotas `/v1/admin/*` |

### Opções de Permissão

```typescript
// PADRÃO: todas as permissões (admin-test group pré-seedado)
const { token } = await createAndAuthenticateUser(app, { tenantId });

// SEM permissões (para testar 403)
const { token } = await createAndAuthenticateUser(app, { tenantId, permissions: [] });

// PERMISSÕES ESPECÍFICAS (para testar acesso granular)
const { token } = await createAndAuthenticateUser(app, {
  tenantId,
  permissions: ['stock.products.create', 'stock.products.read'],
});
```

## Padrão de um Teste E2E

```typescript
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Entity (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create entity', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/entities')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Entity' });

    expect(response.status).toBe(201);
    expect(response.body.entity.name).toBe('Test Entity');
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/entities')
      .send({ name: 'Test Entity' });

    expect(response.status).toBe(401);
  });

  it('should return 403 without permission', async () => {
    const { token } = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: [],
    });

    const response = await request(app.server)
      .post('/v1/entities')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Entity' });

    expect(response.status).toBe(403);
  });
});
```

## Regras Importantes

### NUNCA faça:
- ❌ Criar permissões manualmente via `prisma.permission.create` — elas já existem no banco
- ❌ Criar o grupo `admin-test` manualmente — ele é seedado globalmente
- ❌ Loop de `upsert` para associar permissões — use `createMany` com `skipDuplicates`
- ❌ `app.ready()` fora do `beforeAll` — o Fastify é compartilhado entre specs
- ❌ Depender de IDs hardcoded — use factories para criar dados

### SEMPRE faça:
- ✅ Chamar `createAndSetupTenant()` 1x no `beforeAll`
- ✅ Chamar `createAndAuthenticateUser(app, { tenantId })` por teste que precisa de auth
- ✅ Usar `permissions: []` para testar 403
- ✅ Usar timestamp ou random em nomes para evitar conflitos entre specs
- ✅ Limpar com `afterAll(() => app.close())`

## Executando

```bash
# Módulo específico
npm run test:e2e -- src/http/controllers/stock/products/

# Arquivo específico
npx vitest run --config vitest.e2e.config.ts src/http/controllers/stock/products/v1-create-product.e2e.spec.ts

# Suite completa (lento — ~15-20 min)
npm run test:e2e
```

## Performance

O seed global de permissões reduz de ~757 queries para ~1-2 queries por chamada de
`createAndAuthenticateUser()`. Com 1.709 chamadas na suite, isso elimina ~1.3M queries.
```

- [ ] **Step 2: Commit**

```bash
cd D:/Code/Projetos/OpenSea/OpenSea-API
git add docs/guides/e2e-testing.md
git commit -m "docs: add E2E testing guide with performance patterns"
```

---

## Task 5: Validação final — rodar módulos representativos

**Files:** Nenhum — apenas validação.

- [ ] **Step 1: Rodar módulo audit (100% coverage, rápido)**

Run: `cd D:/Code/Projetos/OpenSea/OpenSea-API && npx vitest run --config vitest.e2e.config.ts src/http/controllers/audit/ 2>&1 | tail -15`

Expected: PASS, sem erros

- [ ] **Step 2: Rodar módulo rbac (100% coverage, usa permissões)**

Run: `cd D:/Code/Projetos/OpenSea/OpenSea-API && npx vitest run --config vitest.e2e.config.ts src/http/controllers/rbac/ 2>&1 | tail -15`

Expected: PASS

- [ ] **Step 3: Rodar módulo stock (91% coverage, maior módulo testado)**

Run: `cd D:/Code/Projetos/OpenSea/OpenSea-API && npx vitest run --config vitest.e2e.config.ts src/http/controllers/stock/ 2>&1 | tail -15`

Expected: PASS (antes crashava com heap out of memory — agora deve funcionar)

- [ ] **Step 4: Rodar módulo core (usa super admin + permissões específicas)**

Run: `cd D:/Code/Projetos/OpenSea/OpenSea-API && npx vitest run --config vitest.e2e.config.ts src/http/controllers/core/ 2>&1 | tail -20`

Expected: PASS

- [ ] **Step 5: Medir tempo comparativo**

Medir o tempo de um módulo antes e depois (se possível, comparar com log anterior).

---

## Resumo de Impacto

| Métrica | Antes | Depois |
|---------|-------|--------|
| Queries por `createAndAuthenticateUser` | ~757 | ~1-2 |
| Total queries na suite | ~1.293.713 | ~3.418 |
| Seed global | 0 queries | ~4 queries (1x) |
| Heap memory pressure | Alta (OOM em stock) | Baixa |
| Tempo estimado da suite | ~6 horas | ~15-20 min |

## Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Permissão nova adicionada ao sistema mas não ao `ALL_PERMISSIONS` | Testes falham com 403 → dev precisa adicionar ao `e2e-permissions.ts` |
| `vitest-setup-e2e.ts` falha no seed | Erro claro com mensagem "Admin test group not found" |
| Testes que dependem de permissões criadas em ordem específica | Nenhum teste existente faz isso |
| Cache do adminGroupId fica stale | Impossível — singleFork compartilha processo |
