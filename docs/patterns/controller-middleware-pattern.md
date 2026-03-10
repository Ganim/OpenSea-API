# Pattern: Controller and Middleware

## Problem

Uma API REST com múltiplos módulos, multi-tenancy e controle de acesso granular (RBAC) precisa de um padrão consistente para:

- Registrar rotas sem duplicar configuração de segurança
- Validar entradas e documentar a API sem manter schemas separados
- Aplicar autenticação, seleção de tenant, módulos do plano e permissões na ordem correta
- Mapear erros de domínio para códigos HTTP adequados
- Garantir isolamento por tenant em cada requisição

## Solution

O OpenSea-API combina quatro pilares:

1. **Controllers como funções** — cada controller é uma função `async (app: FastifyInstance) => void` que registra uma única rota via `app.route({...})`.
2. **`preHandler` em cadeia** — middlewares são compostos no array `preHandler` da rota, executados sequencialmente antes do handler.
3. **Zod + `fastify-type-provider-zod`** — schemas Zod no campo `schema` da rota validam entrada e serializam saída, gerando a spec OpenAPI automaticamente.
4. **`errorHandler` global** — converte erros de domínio em respostas HTTP estruturadas com `code` e `requestId`.

---

## Implementation

### 1. Estrutura de um Controller

Cada controller é uma função assíncrona que recebe `FastifyInstance` e registra exatamente uma rota. O padrão adota `app.withTypeProvider<ZodTypeProvider>().route({...})` para habilitar inferência de tipos a partir do schema Zod.

```typescript
// src/http/controllers/stock/products/v1-create-product.controller.ts

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { createPlanLimitsMiddleware } from '@/http/middlewares/tenant/verify-plan-limits';
import { createProductSchema, productResponseSchema } from '@/http/schemas';
import { productToDTO } from '@/mappers/stock/product/product-to-dto';
import { makeCreateProductUseCase } from '@/use-cases/stock/products/factories/make-create-product-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createProductController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/products',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPlanLimitsMiddleware('products'),
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.PRODUCTS.CREATE,
        resource: 'products',
      }),
    ],
    schema: {
      tags: ['Stock - Products'],
      summary: 'Create a new product',
      body: createProductSchema,
      response: {
        201: z.object({ product: productResponseSchema }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { name, description, status, templateId } = request.body;

      try {
        const createProductUseCase = makeCreateProductUseCase();
        const { product } = await createProductUseCase.execute({
          tenantId,
          name,
          description,
          status,
          templateId,
        });

        await logAudit(request, { /* ... */ });

        return reply.status(201).send({ product: productToDTO(product) });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error; // Repassado para o errorHandler global
      }
    },
  });
}
```

**Convenções obrigatórias:**

- Nome do arquivo: `v1-{verbo}-{recurso}.controller.ts`
- Nome da função exportada: `{verbo}{Recurso}Controller` (camelCase)
- URL sempre prefixada com `/v1/`
- O `tenantId` é sempre extraído de `request.user.tenantId!` (exclamação garante que `verifyTenant` já validou)
- Erros conhecidos são tratados localmente; erros inesperados são relançados para o `errorHandler` global

---

### 2. Routes File — Agrupamento por Módulo

Cada subdiretório de controllers tem um arquivo `routes.ts` que instancia todos os controllers do módulo e aplica rate limiting diferenciado por tipo de operação.

```typescript
// src/http/controllers/stock/products/routes.ts

import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { rateLimitConfig } from '@/config/rate-limits';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { createProductController } from './v1-create-product.controller';
import { deleteProductController } from './v1-delete-product.controller';
import { getProductByIdController } from './v1-get-product-by-id.controller';
import { listProductsController } from './v1-list-products.controller';
import { updateProductController } from './v1-update-product.controller';

export async function productsRoutes(app: FastifyInstance) {
  // Hook de módulo: bloqueia toda a rota se o tenant não tiver o módulo STOCK
  app.addHook('onRequest', createModuleMiddleware('STOCK'));

  // Operações de escrita privilegiada (delete) — rate limit mais restritivo
  app.register(async (adminApp) => {
    adminApp.register(rateLimit, rateLimitConfig.admin); // 300/min
    adminApp.register(deleteProductController);
  }, { prefix: '' });

  // Mutações (create, update) — rate limit de mutação
  app.register(async (managerApp) => {
    managerApp.register(rateLimit, rateLimitConfig.mutation); // 100/min
    managerApp.register(createProductController);
    managerApp.register(updateProductController);
  }, { prefix: '' });

  // Leituras — rate limit de consulta
  app.register(async (queryApp) => {
    queryApp.register(rateLimit, rateLimitConfig.query); // 120/min
    queryApp.register(getProductByIdController);
    queryApp.register(listProductsController);
  }, { prefix: '' });
}
```

O `addHook('onRequest', ...)` no nível do módulo aplica a verificação de módulo do plano a **todos** os controllers dentro daquele arquivo `routes.ts`, sem repetir a linha em cada controller individualmente.

---

### 3. Registro Central de Rotas

Todas as rotas são registradas em `src/http/routes.ts` via `app.register(...)`. A função `registerRoutes` é o único ponto de entrada para o roteamento da aplicação.

```typescript
// src/http/routes.ts

export async function registerRoutes(app: FastifyInstance) {
  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(usersRoutes);
  // ... (50+ módulos)
  await app.register(productsRoutes);
  await app.register(variantsRoutes);
  await app.register(categoriesRoutes);
  // ...
}
```

Esta função é registrada em `src/app.ts` via `app.register(registerRoutes)`.

---

### 4. Zod Schema Validation

Os schemas Zod cumprem três funções simultâneas:

1. **Validação de entrada** — o Fastify rejeita requests que não conformam ao schema antes de o handler executar
2. **Serialização de saída** — o campo `response` define o shape exato da resposta, eliminando dados não mapeados
3. **Documentação OpenAPI** — o plugin `fastify-type-provider-zod` transforma os schemas em JSON Schema para o Swagger

```typescript
// src/http/schemas/stock/products/product.schema.ts

export const createProductSchema = z.object({
  name: nameSchema,                                          // min 2, max 100, trim
  description: z.string().max(1000).optional(),
  status: productStatusSchema.optional().default('ACTIVE'),  // enum: DRAFT|ACTIVE|INACTIVE|...
  outOfLine: z.boolean().optional().default(false),
  attributes: z.record(z.string(), z.any()).optional(),
  templateId: idSchema,                                      // UUID obrigatório
  supplierId: idSchema.optional(),
  manufacturerId: idSchema.optional(),
  categoryIds: z.array(z.string().uuid()).optional(),
});

// updateProductSchema é o createSchema com campos opcionais
export const updateProductSchema = z.object({
  name: nameSchema.optional(),
  description: z.string().max(1000).optional(),
  status: productStatusSchema.optional(),
  // code e fullCode são IMUTÁVEIS após criação — não aparecem no updateSchema
  // ...
});
```

**Schemas primitivos reutilizáveis** estão em `src/http/schemas/common.schema.ts`:

| Schema | Validação |
|--------|-----------|
| `idSchema` | `z.string().uuid()` |
| `nameSchema` | `z.string().min(2).max(100).trim()` |
| `emailSchema` | `z.string().email().toLowerCase().trim()` |
| `strongPasswordSchema` | mín. 8 chars, maiúscula, minúscula, número, especial |
| `dateSchema` | `z.coerce.date()` |
| `priceSchema` | `z.coerce.number().nonnegative().multipleOf(0.01)` |
| `queryBooleanSchema` | trata `"true"/"false"/"1"/"0"` de query params corretamente |

**Named Schemas para OpenAPI `$ref`:** O arquivo `src/http/schemas/register-named-schemas.ts` registra schemas-chave no registry global do Zod para que o Swagger gere referências `$ref` em vez de definições inline duplicadas. Este arquivo é carregado uma única vez na inicialização, antes do registro das rotas, somente quando `ENABLE_SWAGGER=true`.

```typescript
// src/http/schemas/register-named-schemas.ts
import { z } from 'zod';
import { productResponseSchema } from './stock/products/product.schema';

z.globalRegistry.add(productResponseSchema, { id: 'Product' });
// ... demais entidades
```

---

### 5. Middleware Chain

A cadeia padrão para rotas de tenant é:

```
verifyJwt → verifyTenant → [createModuleMiddleware] → [createPlanLimitsMiddleware] → createPermissionMiddleware
```

O `createModuleMiddleware` normalmente é aplicado no hook `onRequest` do `routes.ts` (não em cada controller). Os demais middlewares vão no `preHandler` do controller.

#### verifyJwt

Verifica o JWT e valida se a sessão ainda está ativa no banco de dados.

```typescript
// src/http/middlewares/rbac/verify-jwt.ts

export async function verifyJwt(request: FastifyRequest) {
  try {
    await request.jwtVerify();

    // Tokens do tipo 'serve' são de curta duração e não precisam de validação de sessão
    if (request.user.tokenType === 'serve') return;

    const sessionsRepository = new PrismaSessionsRepository();
    const session = await sessionsRepository.findById(
      new UniqueEntityID(request.user.sessionId),
    );

    if (!session)           throw new UnauthorizedError('Session not found or has been revoked');
    if (session.revokedAt)  throw new UnauthorizedError('Session has been revoked');
    if (session.expiredAt && session.expiredAt < new Date())
                            throw new UnauthorizedError('Session has expired');
  } catch (error) {
    if (error instanceof UnauthorizedError) throw error;
    throw new UnauthorizedError('User not authorized');
  }
}
```

Após executar com sucesso, `request.user` contém:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `sub` | `string` | ID do usuário (UUID) |
| `tenantId` | `string \| undefined` | Presente apenas em JWT de tenant selecionado |
| `isSuperAdmin` | `boolean` | Indica acesso à área Central |
| `sessionId` | `string` | ID da sessão para verificação de revogação |
| `tokenType` | `'access' \| 'serve'` | Tipo do token |

#### verifyTenant

Garante que o JWT contém `tenantId`, ou seja, que o usuário já selecionou um tenant via `POST /v1/auth/select-tenant`.

```typescript
// src/http/middlewares/rbac/verify-tenant.ts

export async function verifyTenant(request: FastifyRequest) {
  if (!request.user || !request.user.tenantId) {
    throw new ForbiddenError(
      'No tenant selected. Please select a tenant first via POST /v1/auth/select-tenant',
    );
  }
}
```

#### verifySuperAdmin

Utilizado exclusivamente nas rotas `/v1/admin/*`. Verifica o campo `isSuperAdmin` do JWT. Super admins **não** precisam de `verifyTenant`.

```typescript
// src/http/middlewares/rbac/verify-super-admin.ts
// Exemplo de uso: preHandler: [verifyJwt, verifySuperAdmin]

export async function verifySuperAdmin(request: FastifyRequest) {
  if (!request.user?.isSuperAdmin) {
    throw new ForbiddenError(
      'Access denied. This endpoint requires super admin privileges.',
    );
  }
}
```

#### createModuleMiddleware

Factory que verifica se o plano do tenant inclui o módulo necessário. Normalmente aplicado via `addHook('onRequest', ...)` no `routes.ts` do módulo.

```typescript
// src/http/middlewares/tenant/verify-module.ts

export type SystemModule =
  | 'CORE' | 'STOCK' | 'SALES' | 'HR' | 'PAYROLL' | 'REPORTS'
  | 'AUDIT' | 'REQUESTS' | 'NOTIFICATIONS' | 'FINANCE'
  | 'CALENDAR' | 'STORAGE' | 'EMAIL' | 'TASKS';

export function createModuleMiddleware(module: SystemModule) {
  return async function verifyModule(request: FastifyRequest) {
    if (!request.user) return; // verifyJwt ainda não executou (onRequest hook)

    const tenantContextService = new TenantContextService();
    const isEnabled = await tenantContextService.isModuleEnabled(
      request.user.tenantId!,
      module,
    );

    if (!isEnabled) {
      throw new ForbiddenError(
        `Module '${module}' is not available in your current plan.`,
      );
    }
  };
}
```

#### createFeatureFlagMiddleware

Factory que verifica se uma feature flag específica está habilitada para o tenant.

```typescript
// src/http/middlewares/tenant/verify-feature-flag.ts
// Exemplo de uso: preHandler: [verifyJwt, verifyTenant, createFeatureFlagMiddleware('bulk-import')]

export function createFeatureFlagMiddleware(flag: string) {
  return async function verifyFeatureFlag(request: FastifyRequest) {
    const tenantContextService = new TenantContextService();
    const isEnabled = await tenantContextService.isFeatureEnabled(
      request.user.tenantId!,
      flag,
    );

    if (!isEnabled) {
      throw new ForbiddenError(`Feature '${flag}' is not enabled for your organization.`);
    }
  };
}
```

#### createPlanLimitsMiddleware

Verifica se o tenant atingiu o limite de recursos do plano antes de permitir criação.

```typescript
// src/http/middlewares/tenant/verify-plan-limits.ts
// Recursos verificáveis: 'users' | 'products' | 'warehouses'

export function createPlanLimitsMiddleware(resource: PlanResource) {
  return async function verifyPlanLimits(request: FastifyRequest) {
    const plan = await tenantContextService.getTenantPlan(tenantId);
    const currentCount = await config.countFn(tenantId);

    if (currentCount >= plan.limits[config.limitKey]) {
      throw new ForbiddenError(
        `Limite do plano atingido: sua empresa pode ter no máximo ${maxAllowed} ${config.label}.`,
      );
    }
  };
}
```

#### createPermissionMiddleware

Verifica se o usuário possui a permissão exata especificada. Consulta o `PermissionService` com cache em três camadas (L1 in-memory, L2 Redis, L3 DB). O `PermissionService` é um **singleton** compartilhado entre requests.

```typescript
// src/http/middlewares/rbac/verify-permission.ts

export function createPermissionMiddleware(options: PermissionCheckOptions) {
  return async function verifyPermission(request: FastifyRequest) {
    const permissionService = createPermissionServiceInstance(); // singleton

    const result = await permissionService.checkPermission({
      userId: new UniqueEntityID(request.user.sub!),
      permissionCode: options.permissionCode,
      resource: options.resource,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      endpoint: request.url,
    });

    if (!result.allowed) {
      throw new ForbiddenError(`Permission denied: ${options.permissionCode}`);
    }
  };
}
```

Variantes disponíveis para casos especiais:

| Factory | Comportamento |
|---------|--------------|
| `createPermissionMiddleware({ permissionCode })` | Verifica exatamente **uma** permissão (AND) |
| `createAnyPermissionMiddleware([...codes])` | Verifica se o usuário tem **qualquer uma** das permissões (OR) |
| `createAllPermissionsMiddleware([...codes])` | Verifica se o usuário tem **todas** as permissões (AND múltiplo) |

#### createScopeMiddleware / createScopeIdentifierMiddleware

Para módulo HR, onde o acesso pode ser restrito ao próprio departamento, há middlewares de escopo que verificam permissões `.all` vs `.team`.

```typescript
// Exemplo no controller de listagem de funcionários
const checkEmployeesListScope = createScopeIdentifierMiddleware('hr.employees.list');

// preHandler: [verifyJwt, verifyTenant, checkEmployeesListScope]
// Após execução: request.scopeCheck = { allowed: true, scope: 'all' | 'team', userDepartmentId? }

// No handler:
const effectiveDepartmentId =
  scopeCheck?.scope === 'team' && scopeCheck.userDepartmentId
    ? scopeCheck.userDepartmentId   // restringe ao departamento do usuário
    : departmentId;                  // usa o filtro informado pelo cliente
```

---

### 6. Cadeia de Middlewares por Tipo de Rota

| Tipo de Rota | Cadeia `preHandler` |
|---|---|
| Rota pública (sem auth) | `[]` |
| Rota de super admin | `[verifyJwt, verifySuperAdmin]` |
| Rota de tenant (leitura) | `[verifyJwt, verifyTenant, createPermissionMiddleware(...)]` |
| Rota de tenant (criação c/ limite) | `[verifyJwt, verifyTenant, createPlanLimitsMiddleware(...), createPermissionMiddleware(...)]` |
| Rota de tenant (feature flag) | `[verifyJwt, verifyTenant, createFeatureFlagMiddleware('...'), createPermissionMiddleware(...)]` |
| Rota HR com escopo de equipe | `[verifyJwt, verifyTenant, createScopeIdentifierMiddleware('...')]` |

O `createModuleMiddleware` é aplicado **no nível do `routes.ts`** via `addHook('onRequest', ...)`, não no `preHandler` de cada controller — portanto não aparece na tabela acima, mas está implícito para todos os módulos que não sejam `CORE`.

---

### 7. Error Handling

O handler global de erros (`src/@errors/error-handler.ts`) intercepta todos os erros não tratados e os converte em respostas HTTP estruturadas com três campos obrigatórios:

```json
{
  "code": "RESOURCE_NOT_FOUND",
  "message": "Product not found",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Mapeamento de erros de domínio para HTTP:**

| Classe de Erro | Status HTTP | Código (`ErrorCodes`) |
|---|---|---|
| `ZodError` / `FST_ERR_VALIDATION` | 400 | `VALIDATION_ERROR` |
| `BadRequestError` | 400 | `BAD_REQUEST` (ou código customizado) |
| `UnauthorizedError` | 401 | `UNAUTHORIZED` |
| `ForbiddenError` | 403 | `FORBIDDEN` |
| `UserBlockedError` | 403 | `USER_BLOCKED` |
| `PasswordResetRequiredError` | 403 | `PASSWORD_RESET_REQUIRED` |
| `ResourceNotFoundError` | 404 | `RESOURCE_NOT_FOUND` (ou código customizado) |
| `VolumeAlreadyExistsError` | 409 | `VOLUME_ALREADY_EXISTS` |
| Rate limit (`429`) | 429 | `RATE_LIMITED` |
| Erro inesperado | 500 | `INTERNAL_ERROR` |

Erros com semântica específica (ex.: `FINANCE_CATEGORY_MAX_DEPTH`) são passados como segundo argumento para `BadRequestError` ou `ResourceNotFoundError`:

```typescript
throw new BadRequestError(
  'Categoria atingiu profundidade máxima (5 níveis)',
  ErrorCodes.FINANCE_CATEGORY_MAX_DEPTH,
);
```

**Tratamento local vs. global:**

- Erros **previsíveis** (ex.: `ResourceNotFoundError`, `BadRequestError`) são capturados no próprio handler e retornam respostas formatadas com `reply.status(...).send({ message })`.
- Erros **inesperados** são relançados via `throw error` e capturados pelo `errorHandler` global, que os reporta ao Sentry e retorna 500.

---

### 8. Pagination Response

Todas as rotas de listagem paginada seguem o padrão `{ data, meta }`:

```typescript
// Schema de resposta paginada offset (padrão para a maioria dos módulos)
z.object({
  data: z.array(itemSchema),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    pages: z.number(),
    hasNext: z.boolean(),
    hasPrevious: z.boolean(),
  }),
})
```

Para volumes grandes (ex.: mensagens de e-mail), o módulo usa **paginação por cursor**:

```typescript
z.object({
  data: z.array(itemSchema),
  meta: z.object({
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
    startCursor: z.string().nullable(),
    endCursor: z.string().nullable(),
    totalCount: z.number().optional(),
  }),
})
```

**Query params de paginação offset:**

| Parâmetro | Tipo | Padrão | Máximo |
|-----------|------|--------|--------|
| `page` | `number` | `1` | — |
| `limit` | `number` | `20` | `100` |

Os helpers `calculateOffsetMeta`, `encodeCursor` e `decodeCursor` estão em `src/http/schemas/pagination.schema.ts`.

---

### 9. Audit Logging

Controllers que realizam mutações (create, update, delete) registram um log de auditoria via `logAudit(request, params)`:

```typescript
await logAudit(request, {
  message: AUDIT_MESSAGES.STOCK.PRODUCT_UPDATE,
  entityId: product.id.toString(),
  placeholders: { userName, productName: product.name },
  oldData: { name: oldProduct.name, status: oldProduct.status },
  newData: { name, description, status },
});
```

- O helper extrai automaticamente `userId`, `tenantId`, `ip`, `userAgent` e `endpoint` do `request`.
- Falhas no log de auditoria **não interrompem** a operação principal (erros são silenciados com `console.error`).
- Dados sensíveis (`password`, `token`, `secret`, etc.) são automaticamente substituídos por `[REDACTED]`.

---

### 10. Plugins de Infraestrutura

Além dos middlewares de negócio, a aplicação registra plugins transversais em `src/app.ts`:

| Plugin | Função |
|--------|--------|
| `requestIdPlugin` | Adiciona `X-Request-Id` único a cada request (UUID v4 gerado ou repassado do header do cliente) |
| `idempotencyPlugin` | Cacheia respostas de `POST`/`PUT` no Redis por `Idempotency-Key` (TTL: 24h) |
| `cacheControlPlugin` | Adiciona `Cache-Control` + `ETag` a respostas `GET 200`; suporta `304 Not Modified` |
| `prometheusPlugin` | Expõe métricas em `/metrics` para coleta pelo Prometheus |
| `loginBruteforceGuard` | Bloqueia IP após 10 tentativas de login falhas em 15 minutos |
| `@fastify/helmet` | Adiciona headers de segurança (HSTS, CSP, etc.) |
| `@fastify/cors` | Controla origens permitidas (lista de `allowedOrigins` + `credentials: true`) |
| `@fastify/rate-limit` | Rate limiting global (300/min por IP) + configurações específicas por grupo de rotas |
| `@fastify/multipart` | Suporte a upload de arquivos (máx. 25MB por arquivo, 10 arquivos por request) |

---

## Files

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/app.ts` | Configuração do Fastify, plugins, `errorHandler`, registro de rotas |
| `src/http/routes.ts` | Registro centralizado de todos os módulos de rotas |
| `src/http/controllers/{module}/{resource}/routes.ts` | Agrupamento de controllers do recurso com rate limit e `onRequest` hooks |
| `src/http/controllers/{module}/{resource}/v1-*.controller.ts` | Implementação de uma rota individual |
| `src/http/middlewares/rbac/verify-jwt.ts` | Autenticação JWT + validação de sessão |
| `src/http/middlewares/rbac/verify-tenant.ts` | Verificação de tenant selecionado |
| `src/http/middlewares/rbac/verify-super-admin.ts` | Guard de super admin |
| `src/http/middlewares/rbac/verify-permission.ts` | Guard de permissão RBAC (single, any, all) |
| `src/http/middlewares/rbac/verify-scope.ts` | Guard de escopo `.all` vs `.team` (módulo HR) |
| `src/http/middlewares/tenant/verify-module.ts` | Guard de módulo do plano |
| `src/http/middlewares/tenant/verify-feature-flag.ts` | Guard de feature flag |
| `src/http/middlewares/tenant/verify-plan-limits.ts` | Guard de limites do plano (users/products/warehouses) |
| `src/http/schemas/common.schema.ts` | Schemas Zod primitivos reutilizáveis |
| `src/http/schemas/pagination.schema.ts` | Schemas e helpers de paginação (offset e cursor) |
| `src/http/schemas/register-named-schemas.ts` | Registro de schemas no Zod global registry para OpenAPI `$ref` |
| `src/http/helpers/audit.helper.ts` | Helper `logAudit` para registro de auditoria nos controllers |
| `src/@errors/error-handler.ts` | Handler global de erros do Fastify |
| `src/@errors/error-codes.ts` | Enum de códigos de erro machine-readable |
| `src/@errors/use-cases/*.ts` | Classes de erro de domínio (`BadRequestError`, `ResourceNotFoundError`, etc.) |
| `src/config/rate-limits.ts` | Configurações de rate limit por categoria de endpoint |

---

## Rules

### Quando usar este padrão

- **Sempre** ao criar um novo endpoint na API — não há outro padrão de rota no projeto.
- O `preHandler` deve sempre começar com `verifyJwt` para rotas autenticadas.
- Para rotas de tenant, `verifyTenant` deve vir imediatamente após `verifyJwt`.
- Para rotas de super admin, usar `verifySuperAdmin` e **nunca** `verifyTenant`.

### Ordem obrigatória do preHandler

```
verifyJwt
  → verifyTenant            (rotas de tenant) OU verifySuperAdmin (rotas admin)
    → createModuleMiddleware  (via onRequest no routes.ts, implícito)
      → createFeatureFlagMiddleware  (quando aplicável)
        → createPlanLimitsMiddleware   (somente em criação com limite)
          → createPermissionMiddleware   (ou createScopeMiddleware para HR)
```

Inverter a ordem pode causar erros de `request.user` indefinido ou verificações de permissão sem tenant.

### Armadilhas comuns

- **Usar `verifyTenant` em rotas admin**: super admins não têm `tenantId` no JWT — a rota retornaria 403 mesmo para admins válidos.
- **Criar controllers como classes**: o Fastify registra rotas via funções; classes não são suportadas neste padrão.
- **Relançar `throw error` sem await**: o `errorHandler` global só captura erros síncronos ou de promises rejeitadas com `throw`. Erros em callbacks sem `await` não são capturados.
- **Validar manualmente o body**: o `validatorCompiler` do Zod já rejeita o request antes do handler se o body não conformar. Nunca revalidar manualmente o que o schema já valida.
- **Aplicar `createModuleMiddleware` no `preHandler` de cada controller**: o padrão correto é `addHook('onRequest', ...)` no `routes.ts` para evitar duplicação.
- **Instanciar `PermissionService` por request**: o serviço é um singleton — criá-lo fora da factory faz com que o cache L1 in-memory seja ineficaz.
- **Swagger em testes**: `ENABLE_SWAGGER=true` em ambiente de teste faz o `app.ready()` demorar mais de 5 minutos devido à compilação Zod → JSON Schema. O Swagger é automaticamente desabilitado quando `NODE_ENV=test` ou `VITEST=true`.
