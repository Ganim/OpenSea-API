# Adicionando uma Nova Entidade — Full Chain

**Skill dedicada:** `new-entity` (invocar via `/new-entity` ou Skill tool). Este doc explica a arquitetura e serve como referência quando se quer entender **por que** a skill faz o que faz.

---

## Camadas afetadas (em ordem)

Uma nova entidade no OpenSea-API toca **11 arquivos** distribuídos em 7 camadas. Pular uma camada quebra a Clean Architecture ou quebra testes. A ordem abaixo é a ordem de execução da skill.

```
┌─ 1. prisma/schema.prisma           (DB schema)
├─ 2. npx prisma generate             (regen client)
├─ 3. npx prisma migrate dev          (generate migration)
├─ 4. src/entities/<mod>/<entity>.ts           (domain entity + getters/setters)
├─ 5. src/http/schemas/<mod>/<entity>.schema.ts (Zod: create/update/response)
├─ 6. src/mappers/<mod>/<entity>/
│     ├─ <entity>-to-dto.ts                     (domain → API response)
│     └─ <entity>-prisma-to-domain.ts           (DB row → domain entity)
├─ 7. src/repositories/<mod>/
│     ├─ <entity>-repository.ts                 (interface)
│     ├─ prisma/prisma-<entity>-repository.ts   (Prisma impl)
│     └─ in-memory/in-memory-<entity>-repository.ts (test impl)
├─ 8. src/use-cases/<mod>/<entity>/
│     ├─ create-<entity>.ts                     (+ .spec.ts)
│     ├─ update-<entity>.ts
│     ├─ delete-<entity>.ts
│     ├─ get-<entity>.ts
│     ├─ list-<entity>s.ts
│     └─ factories/make-*-use-case.ts           (DI factory pra cada use case)
├─ 9. src/http/controllers/<mod>/<entity>/
│     ├─ v1-create-<entity>.controller.ts       (+ .e2e.spec.ts)
│     ├─ v1-update-<entity>.controller.ts
│     ├─ v1-delete-<entity>.controller.ts
│     ├─ v1-get-<entity>-by-id.controller.ts
│     └─ v1-list-<entity>s.controller.ts
├─ 10. src/http/routes.ts                       (registrar routes)
└─ 11. prisma/seed-permissions.ts               (adicionar permission codes)
```

---

## Regras inegociáveis (golden rules)

Estas 10 regras **bloqueiam** merge de PR. Origem: `OpenSea-APP/docs/guides/developer-golden-rules.md`.

1. **`preHandler`** (nunca `onRequest`) em controllers — ADR 026
2. **Middleware chain completa:** `[verifyJwt, verifyTenant, createPermissionMiddleware({...})]`
3. **`createPlanLimitsMiddleware`** em todo endpoint CREATE
4. **Repository filtra `tenantId` E `deletedAt: null`** em toda query
5. **Pagination (`skip/take` + count)** em toda listagem
6. **Soft delete** (`deletedAt DateTime?`) em toda entidade
7. **Audit log** via `logAudit()` com texto PT-BR humanizado em toda write operation
8. **Typed errors** (`BadRequestError`, `ResourceNotFoundError`, `ForbiddenError`) — nunca `throw new Error()`
9. **Zod schemas com `.describe()`** em todos inputs (Swagger usa)
10. **Module middleware** no route group via `createModuleMiddleware('STOCK')`

---

## Permission codes

Seguir o padrão 3-level ou 4-level dependendo do módulo:

| Formato                                         | Módulos                                  | Exemplo                       |
| ----------------------------------------------- | ---------------------------------------- | ----------------------------- |
| 3-level: `{module}.{resource}.{action}`         | stock, hr, finance, sales, admin, system | `stock.products.register`     |
| 4-level: `{module}.{group}.{resource}.{action}` | tools                                    | `tools.email.accounts.access` |

**10 ações padrão:** `access`, `register`, `modify`, `remove`, `import`, `export`, `print`, `admin`, `share`, `onlyself`.

**Sales** tem 21 ações domain-specific extras (confirm, approve, cancel, etc.) — ver ADR 025.

Adicionar os codes em `prisma/seed-permissions.ts` e rodar `npm run seed:permissions` local + em cada ambiente.

---

## Audit messages

Criar mensagens em `src/constants/audit-messages/{module}.messages.ts`:

```ts
export const STOCK_WAREHOUSE_MESSAGES = {
  CREATE: {
    action: 'CREATE',
    entity: 'WAREHOUSE',
    module: 'STOCK',
    description: '{{userName}} cadastrou o armazém {{warehouseName}}',
  },
  UPDATE: {
    action: 'UPDATE',
    entity: 'WAREHOUSE',
    module: 'STOCK',
    description: '{{userName}} atualizou o armazém {{warehouseName}}',
  },
  // ...
};
```

No controller, após use case executar com sucesso:

```ts
await logAudit(request, {
  message: STOCK_WAREHOUSE_MESSAGES.CREATE,
  entityId: warehouse.id.toString(),
  placeholders: { warehouseName: warehouse.name },
});
```

Se `AuditAction`, `AuditEntity`, ou `AuditModule` enum não tiverem o valor necessário, adicionar em `schema.prisma`.

---

## Tests

- **Unit:** `<use-case>.spec.ts` usando `in-memory-<entity>-repository.ts`. Cobrir happy path + business rules + error cases.
- **E2E:** `<controller>.e2e.spec.ts` rodando contra DB de teste real. Cobrir auth (401), permissão (403), tenant isolation, happy path (201/200).

Ver `OpenSea-API/docs/patterns/testing-patterns.md`.

---

## Gotchas conhecidos

- **Prisma field naming:** DB snake_case com `@map()`, entity camelCase. Ex: `@map("legal_name") legalName String`.
- **`address` no Prisma** mapeia para `addressLine1` na entity; `addressLine2` sempre `null` por padrão.
- **Não usar `prisma db push`** em prod — sempre gerar migration file.
- **E2E performance:** Swagger DEVE estar off em test env (`isTestEnv` em `app.ts`). Caso contrário `app.ready()` trava >5min no Windows. Com fix: ~700ms.
- **Soft delete em repository:** listagens filtram `deletedAt: null`. Delete faz `update({ deletedAt: new Date() })`, não `delete()`.

---

## Fluxo de uso da skill

```
/new-entity
↓
Skill pergunta: módulo, nome da entidade, campos principais
↓
Skill gera todos os 11 arquivos seguindo os patterns
↓
Você revisa, ajusta, e:
  - npx prisma migrate dev --name add_<entity>
  - npm run seed:permissions
  - npm test -- <entity>.spec.ts
  - npm run test:e2e -- <entity>.e2e.spec.ts
↓
Commit atômico seguindo Conventional Commits:
  feat(<mod>): add <entity> CRUD
```

---

## Referências

- `patterns/` — todos os patterns backend (repository, use-case, mapper, etc.)
- `adr/001-clean-architecture.md` — base da arquitetura
- `adr/003-rbac-permission-pattern.md` — sistema de permissões
- `adr/026-finance-middleware-standardization.md` — `preHandler` rule
- `OpenSea-APP/docs/guides/developer-golden-rules.md` — regras cross-cutting
