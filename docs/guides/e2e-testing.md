# Guia de Testes E2E — OpenSea-API

## Arquitetura

### Setup Global (roda 1x antes de todos os E2E)

O arquivo `prisma/vitest-setup-e2e.ts` executa antes de qualquer teste:

1. Cria schema PostgreSQL isolado (`test_<uuid>`)
2. Aplica todas as migrations (`prisma migrate deploy`)
3. Cria o system user (SYSTEM_USER_ID)
4. **Seeda 752+ permissões + grupo `admin-test` com todas as associações**
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

### NUNCA faca:
- Criar permissoes manualmente via `prisma.permission.create` — elas ja existem no banco (seedadas globalmente)
- Criar o grupo `admin-test` manualmente — ele e seedado em `vitest-setup-e2e.ts`
- Loop de `upsert` para associar permissoes — use `createMany` com `skipDuplicates`
- `app.ready()` fora do `beforeAll` — o Fastify e compartilhado entre specs
- Depender de IDs hardcoded — use factories para criar dados

### SEMPRE faca:
- Chamar `createAndSetupTenant()` 1x no `beforeAll`
- Chamar `createAndAuthenticateUser(app, { tenantId })` por teste que precisa de auth
- Usar `permissions: []` para testar 403
- Usar timestamp ou random em nomes para evitar conflitos entre specs
- Limpar com `afterAll(() => app.close())`

## Adicionando Novas Permissoes

Se um novo modulo ou recurso precisa de permissoes nos testes E2E:

1. Edite `src/utils/tests/e2e-permissions.ts`
2. Adicione as novas permissoes ao objeto `ALL_PERMISSIONS`
3. O seed global vai criar automaticamente na proxima execucao

## Executando

```bash
# Modulo especifico
npm run test:e2e -- src/http/controllers/stock/products/

# Arquivo especifico
npx vitest run --config vitest.e2e.config.ts src/http/controllers/stock/products/v1-create-product.e2e.spec.ts

# Suite completa
npm run test:e2e
```

## Performance

O seed global de permissoes reduz de ~757 queries para ~1-2 queries por chamada de
`createAndAuthenticateUser()`. Com ~1.709 chamadas na suite, isso elimina ~1.3M queries.

### Source of Truth

- Permissoes E2E: `src/utils/tests/e2e-permissions.ts`
- Setup global: `prisma/vitest-setup-e2e.ts`
- Factory de auth: `src/utils/tests/factories/core/create-and-authenticate-user.e2e.ts`
