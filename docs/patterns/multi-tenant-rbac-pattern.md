# Pattern: Multi-Tenant Architecture and RBAC

## Problem

Um sistema SaaS precisa atender múltiplas empresas (tenants) com total isolamento de dados,
diferentes planos de acesso a módulos e controle granular de permissões por usuário. Os
desafios centrais são:

1. **Isolamento de dados**: Cada tenant deve ver apenas seus próprios recursos.
2. **Fluxo de autenticação em dois estágios**: O usuário autentica globalmente e depois
   seleciona em qual empresa vai operar.
3. **Controle de acesso por plano**: Um tenant no plano FREE não pode acessar módulos pagos
   como FINANCE ou HR.
4. **Permissões granulares**: Diferentes usuários dentro de um mesmo tenant têm acessos
   diferentes (ex.: gerente RH vs. analista de estoque).
5. **Feature flags por tenant**: Funcionalidades beta ou experimentais precisam ser
   ativadas individualmente por empresa.

---

## Solution

O OpenSea-API resolve esses desafios com uma cadeia de middlewares progressiva, aplicada
em cada requisição, e um JWT de dois estágios que carrega o contexto de tenant.

### Visão geral da cadeia de segurança

```
Requisição HTTP
       │
       ▼
  [verifyJwt]          ← Valida assinatura + sessão ativa no banco
       │
       ▼
  [verifyTenant]       ← Garante que o JWT contém tenantId
       │
       ▼
  [verifyModule]       ← Verifica se o plano do tenant inclui o módulo
  (via onRequest hook) │   (ex.: STOCK, HR, FINANCE)
       │
       ▼
  [verifyPermission]   ← Verifica se o usuário tem a permissão específica
  (via preHandler)     │   (ex.: stock.products.create)
       │
       ▼
  Controller Handler   ← Usa request.user.tenantId para isolar dados
```

Para rotas de super admin, o fluxo é diferente:

```
Requisição HTTP
       │
       ▼
  [verifyJwt]          ← Valida assinatura + sessão ativa
       │
       ▼
  [verifySuperAdmin]   ← Verifica user.isSuperAdmin === true
       │
       ▼
  Controller Handler   ← Sem tenantId — acessa dados globais do sistema
```

---

## Auth Flow: Login → Select Tenant → JWT com Tenant

### Estágio 1 — Autenticação Global

O usuário chama `POST /v1/auth/login/password` com email e senha. O use case
`AuthenticateWithPasswordUseCase` valida as credenciais, cria uma sessão (`Session`) no
banco e assina o **JWT global** (sem `tenantId`):

```typescript
// src/use-cases/core/sessions/create-session.ts
const token = await reply.jwtSign(
  {
    sessionId: newSession.id.toString(),
    isSuperAdmin: user.isSuperAdmin ?? false,
    // tenantId está AUSENTE neste token
  },
  { sign: { sub: user.id.toString() } },
);
```

O `refreshToken` também é assinado (expiração 7 dias) e persistido no banco, vinculado
à sessão:

```typescript
const refreshToken = await reply.jwtSign(
  {
    sessionId: newSession.id.toString(),
    jti: new UniqueEntityID().toString(),
  },
  { sign: { sub: user.id.toString(), expiresIn: '7d' } },
);
```

**Otimização**: Se o usuário pertence a exatamente um tenant e não é super admin, o
controller de login já chama `SelectTenantUseCase` automaticamente e retorna o token
com `tenantId` incluído, evitando uma segunda requisição.

### Estágio 2 — Seleção de Tenant

Quando o usuário tem múltiplos tenants (ou quando o auto-select não ocorreu), ele chama
`POST /v1/auth/select-tenant` com o `tenantId` desejado. O use case `SelectTenantUseCase`:

1. Verifica que o tenant existe e está ativo
2. Verifica que o usuário é membro desse tenant (tabela `TenantUser`)
3. Atualiza a sessão com o `tenantId` selecionado
4. Assina um **novo JWT** com `tenantId` incluído

```typescript
// src/use-cases/core/tenants/select-tenant.ts
const token = await reply.jwtSign(
  { sessionId, tenantId, isSuperAdmin },
  { sign: { sub: userId } },
);
```

A partir daí, todas as requisições usam esse token enriquecido.

---

## JWT Structure

### JWT Global (pós-login, pré-seleção de tenant)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `sub` | `string` (UUID) | ID do usuário (`User.id`) |
| `sessionId` | `string` (UUID) | ID da sessão ativa |
| `isSuperAdmin` | `boolean` | Se é super admin do sistema |
| `iss` | `string` | `"opensea-api"` |
| `aud` | `string` | `"opensea-client"` |
| `exp` | `number` | Expiração — access token: 30 minutos |

### JWT com Tenant (pós-select-tenant)

Todos os campos acima, mais:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `tenantId` | `string` (UUID) | ID do tenant selecionado |

### Definição TypeScript do payload

```typescript
// src/@types/fastify-jwt.d.ts
declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: {
      sub: string;               // userId
      sessionId: string;
      permissions?: string[];
      tenantId?: string;         // ausente antes do select-tenant
      isSuperAdmin?: boolean;
      tokenType?: 'session' | 'serve';
    };
  }
}
```

### Algoritmo de assinatura

O sistema suporta dois algoritmos, selecionados via variáveis de ambiente:

- **HS256** (padrão): usa `JWT_SECRET` — simétrico, adequado para ambientes sem
  requisitos de rotação de chaves.
- **RS256** (produção recomendada): usa par `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` —
  assimétrico, permite que serviços externos validem o token sem conhecer a chave privada.

```typescript
// src/config/jwt.ts
export const jwtConfig = {
  algorithm: (env.JWT_PRIVATE_KEY ? 'RS256' : 'HS256') as 'RS256' | 'HS256',
  accessTokenExpiresIn: '30m',
  refreshTokenExpiresIn: '7d',
  issuer: 'opensea-api',
  audience: 'opensea-client',
};
```

---

## Middleware Chain

### 1. `verifyJwt`

**Arquivo**: `src/http/middlewares/rbac/verify-jwt.ts`

Valida a assinatura do JWT via `@fastify/jwt`. Após a validação criptográfica, verifica
adicionalmente no banco se a sessão ainda existe e não foi revogada ou expirada.

Tokens do tipo `serve` (tokens de curta duração usados por integrações internas) pulam a
verificação de sessão:

```typescript
export async function verifyJwt(request: FastifyRequest) {
  await request.jwtVerify();

  // Tokens serve são de curta duração (5min) e dispensam verificação de sessão
  if (request.user.tokenType === 'serve') {
    return;
  }

  const session = await sessionsRepository.findById(sessionId);

  if (!session || session.revokedAt || session.expiredAt < new Date()) {
    throw new UnauthorizedError('...');
  }
}
```

### 2. `verifyTenant`

**Arquivo**: `src/http/middlewares/rbac/verify-tenant.ts`

Confirma que `request.user.tenantId` está presente no JWT. Sem isso, o usuário ainda
está no estágio global (não selecionou um tenant):

```typescript
export async function verifyTenant(request: FastifyRequest) {
  if (!request.user || !request.user.tenantId) {
    throw new ForbiddenError(
      'No tenant selected. Please select a tenant first via POST /v1/auth/select-tenant',
    );
  }
}
```

### 3. `createModuleMiddleware` (verifyModule)

**Arquivo**: `src/http/middlewares/tenant/verify-module.ts`

Fábrica que retorna um middleware verificando se o plano do tenant inclui o módulo
especificado. Aplicado como `onRequest` hook nos arquivos `routes.ts` de cada módulo
(antes de `preHandler`), funcionando como um portão de módulo para toda a sub-árvore
de rotas:

```typescript
// Exemplo: src/http/controllers/stock/bins/routes.ts
export async function binsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('STOCK'));
  // Todas as rotas de bins exigem o módulo STOCK no plano
  await getBinByIdController(app);
  // ...
}
```

Internamente delega ao `TenantContextService.isModuleEnabled()`, que usa cache
in-memory de 5 minutos para evitar queries repetidas ao banco.

O módulo `CORE` é sempre habilitado, independentemente do plano.

**Módulos disponíveis**:
`CORE` | `STOCK` | `SALES` | `HR` | `PAYROLL` | `REPORTS` | `AUDIT` |
`REQUESTS` | `NOTIFICATIONS` | `FINANCE` | `CALENDAR` | `STORAGE` | `EMAIL` | `TASKS`

### 4. `createPermissionMiddleware` (verifyPermission)

**Arquivo**: `src/http/middlewares/rbac/verify-permission.ts`

Fábrica que retorna um middleware verificando se o usuário tem uma permissão específica.
Aplicado no `preHandler` de cada rota individualmente:

```typescript
// Exemplo: src/http/controllers/stock/bins/v1-get-bin-by-id.controller.ts
preHandler: [
  verifyJwt,
  verifyTenant,
  createPermissionMiddleware({
    permissionCode: PermissionCodes.STOCK.BINS.READ,
    resource: 'bins',
  }),
],
```

Internamente chama `PermissionService.checkPermission()`, que usa cache de três camadas
(L1 in-memory → L2 Redis → L3 banco).

**Variantes disponíveis**:

| Factory | Comportamento |
|---------|---------------|
| `createPermissionMiddleware(opts)` | Requer UMA permissão específica |
| `createAnyPermissionMiddleware(codes[])` | Requer QUALQUER UMA das permissões (OR) |
| `createAllPermissionsMiddleware(codes[])` | Requer TODAS as permissões (AND) |
| `createScopeMiddleware(opts)` | Verifica `.all` ou `.team` com isolamento de departamento |
| `createScopeIdentifierMiddleware(base)` | Identifica o escopo sem bloquear — preenche `request.scopeCheck` |

### 5. `verifySuperAdmin`

**Arquivo**: `src/http/middlewares/rbac/verify-super-admin.ts`

Exclusivo para rotas `/v1/admin/*`. Verifica `request.user.isSuperAdmin === true`.
Super admins não pertencem a nenhum tenant — operam em nível de sistema:

```typescript
export async function verifySuperAdmin(request: FastifyRequest) {
  if (!user.isSuperAdmin) {
    throw new ForbiddenError(
      'Access denied. This endpoint requires super admin privileges.',
    );
  }
}
```

### 6. `createFeatureFlagMiddleware` (verifyFeatureFlag)

**Arquivo**: `src/http/middlewares/tenant/verify-feature-flag.ts`

Verifica se uma feature flag está habilitada para o tenant atual. Útil para funcionalidades
em beta ou rollouts graduais:

```typescript
// Uso em rotas experimentais
preHandler: [
  verifyJwt,
  verifyTenant,
  createFeatureFlagMiddleware('bulk-import'),
  createPermissionMiddleware({ permissionCode: '...' }),
]
```

Delega ao `TenantContextService.isFeatureEnabled()`, que consulta a tabela
`TenantFeatureFlag` com cache in-memory de 5 minutos.

---

## RBAC Permission System

### Formato dos códigos de permissão

```
{module}.{resource}.{action}[.{scope}]
```

| Segmento | Descrição | Exemplos |
|----------|-----------|---------|
| `module` | Domínio do sistema | `stock`, `hr`, `finance`, `core`, `rbac`, `self` |
| `resource` | Recurso dentro do módulo | `products`, `employees`, `entries` |
| `action` | Ação sobre o recurso | `create`, `read`, `update`, `delete`, `list`, `manage` |
| `scope` | Escopo de acesso (opcional) | `all`, `team` |

**Exemplos reais**:

```
stock.products.create
stock.products.read
hr.employees.read.all      ← acessa todos os funcionários do tenant
hr.employees.read.team     ← acessa apenas funcionários do seu departamento
hr.time-entries.approve.all
rbac.permissions.manage
self.profile.update        ← dados do próprio usuário logado
ui.menu.finance            ← controla visibilidade de menus no frontend
```

### Wildcard matching

O `PermissionService` suporta wildcards por segmento. Um grupo pode ter a permissão
`stock.*.*` e isso cobrirá qualquer ação em qualquer recurso do módulo `stock`:

```typescript
// src/services/rbac/permission-service.ts
private matchesWildcard(requested: string, pattern: string): boolean {
  // "stock.products.create" faz match com "stock.*.create"
  // "stock.products.create" faz match com "*.*.*"
  // O número de segmentos deve ser idêntico
  const requestedParts = requested.split('.');
  const patternParts = pattern.split('.');

  if (requestedParts.length !== patternParts.length) return false;

  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i] !== '*' && patternParts[i] !== requestedParts[i]) {
      return false;
    }
  }
  return true;
}
```

### Precedência: deny > allow

Se um usuário pertence a dois grupos — um com `allow` e outro com `deny` para a mesma
permissão — o **deny sempre prevalece**:

```typescript
const hasDeny = matchingPermissions.some((p) => p.effect === 'deny');
if (hasDeny) {
  return { allowed: false, reason: 'Denied by explicit deny rule' };
}
```

### Herança de grupos

Os grupos de permissão suportam hierarquia. Ao buscar permissões do usuário no banco, o
serviço percorre os grupos ancestrais recursivamente via
`permissionGroupsRepository.findAncestors()`, acumulando todas as permissões herdadas.

### Permissões com escopo `.all` / `.team`

Exclusivo para o módulo HR. O `createScopeMiddleware` verifica em qual escopo o usuário
opera:

- **`.all`**: acessa qualquer recurso do tenant (ex.: gerente de RH vê todos os funcionários)
- **`.team`**: acessa apenas recursos do seu próprio departamento

O middleware resolve o departamento do usuário via `employeesRepository.findByUserId()` e
injeta o resultado em `request.scopeCheck`:

```typescript
// Disponível no handler após o middleware de escopo
const scopeCheck = request.scopeCheck;
if (scopeCheck.scope === 'all') {
  // Lista todos os funcionários do tenant
} else if (scopeCheck.scope === 'team') {
  // Lista apenas funcionários do departamento
  const employees = await repo.findByDepartment(scopeCheck.userDepartmentId);
}
```

---

## PermissionService: Cache em Três Camadas

**Arquivo**: `src/services/rbac/permission-service.ts`

O `PermissionService` é instanciado como **singleton** no processo (um por instância do
servidor), garantindo que o cache L1 in-memory seja efetivo entre requisições:

```typescript
// src/http/middlewares/rbac/verify-permission.ts
let _permissionService: PermissionService | null = null;

function createPermissionServiceInstance(): PermissionService {
  if (!_permissionService) {
    _permissionService = new PermissionService(/* repos */);
  }
  return _permissionService;
}
```

### Camadas de cache

| Camada | Tecnologia | TTL | Escopo |
|--------|-----------|-----|--------|
| L1 | `Map` in-memory (Node.js) | 5 minutos | Por processo |
| L2 | Redis (`permissions:user:{userId}`) | Configurável (padrão: 5 min) | Cross-process |
| L3 | PostgreSQL | N/A — fonte de verdade | Global |

### Fluxo de busca de permissões

```
checkPermission(userId, code)
       │
       ├─ L1 hit? → retorna imediatamente (sub-millisecond)
       │
       ├─ L2 hit? → deserializa, popula L1, retorna
       │
       └─ L3 (banco):
              ├─ Busca grupos ativos do usuário
              ├─ Expande grupos ancestrais (herança)
              ├─ Carrega permissões de todos os grupos
              ├─ Escreve de volta em L1 e L2
              └─ Retorna mapa de permissões
```

### Invalidação de cache

Quando as permissões de um usuário são alteradas (ex.: adição a um novo grupo), ambas as
camadas são invalidadas:

```typescript
permissionService.invalidateUserCache(userId);
// Remove de L1 (Map.delete) e L2 (Redis.del)
```

### Auditoria

Toda verificação de permissão gera um log via `permissionAuditLogsRepository.log()`,
registrando: `userId`, `permissionCode`, `allowed`, `reason`, `ip`, `userAgent`, `endpoint`.
O log é persistido de forma não-bloqueante (o erro no log não cancela a requisição).

---

## Multi-Tenant Data Isolation

O isolamento de dados é garantido pelo `tenantId` presente em todas as queries. O handler
extrai o `tenantId` do JWT e passa para o use case:

```typescript
// Exemplo real: src/http/controllers/stock/bins/v1-get-bin-by-id.controller.ts
handler: async (request, reply) => {
  const tenantId = request.user.tenantId!;
  const { id } = request.params;

  const { bin } = await getBinByIdUseCase.execute({ tenantId, id });
  // O use case usa tenantId em TODAS as queries ao banco
}
```

### Modelo de tenant no banco

Os seguintes modelos Prisma sustentam a multi-tenancy:

| Modelo | Propósito |
|--------|-----------|
| `Tenant` | Empresa cadastrada (name, slug, status, settings) |
| `TenantUser` | Vincula `User` a `Tenant` com papel (owner, admin, member) |
| `TenantPlan` | Plano contratado pelo tenant (pode ter `expiresAt`) |
| `Plan` | Plano disponível (tier: FREE, STARTER, PROFESSIONAL, ENTERPRISE) |
| `PlanModule` | Módulos incluídos em cada plano |
| `TenantFeatureFlag` | Feature flags individuais por tenant |

---

## Super Admin vs. Tenant Admin

| Aspecto | Super Admin | Tenant Admin |
|---------|-------------|--------------|
| Identificação | `isSuperAdmin: true` no JWT | Papel `owner` ou `admin` em `TenantUser` |
| JWT | Sem `tenantId` | Com `tenantId` |
| Rotas de acesso | `/v1/admin/*` | Rotas padrão do tenant |
| Middleware principal | `[verifyJwt, verifySuperAdmin]` | `[verifyJwt, verifyTenant, verifyPermission]` |
| Escopo de dados | Todo o sistema (cross-tenant) | Apenas dados do tenant selecionado |
| Frontend | `/central` (CentralNavbar + CentralSidebar) | `(dashboard)` (NavigationMenu) |
| Permissões RBAC | Não aplicável (acesso total ao admin) | Gerenciadas via grupos de permissão |

### Exemplo de rota super admin

```typescript
// src/http/controllers/admin/v1-admin-dashboard.controller.ts
app.route({
  method: 'GET',
  url: '/v1/admin/dashboard',
  preHandler: [verifyJwt, verifySuperAdmin],
  // Sem verifyTenant — super admin não pertence a nenhum tenant
  handler: async (request, reply) => {
    const stats = await getSystemStatsUseCase.execute();
    // Dados globais: total de tenants, MRR, crescimento mensal, etc.
  },
});
```

### Exemplo de rota tenant-scoped

```typescript
// src/http/controllers/stock/bins/v1-get-bin-by-id.controller.ts
app.route({
  method: 'GET',
  url: '/v1/bins/:id',
  preHandler: [
    verifyJwt,
    verifyTenant,
    createPermissionMiddleware({
      permissionCode: PermissionCodes.STOCK.BINS.READ,
    }),
  ],
  handler: async (request, reply) => {
    const tenantId = request.user.tenantId!;
    // Dados isolados ao tenant
  },
});
```

---

## TenantContextService

**Arquivo**: `src/services/tenant/tenant-context-service.ts`

Centraliza consultas ao contexto do tenant com cache in-memory de 5 minutos por tenant.
Usado internamente por `verifyModule` e `verifyFeatureFlag`.

### Verificação de módulo

```typescript
async isModuleEnabled(tenantId: string, module: SystemModule): Promise<boolean> {
  if (module === 'CORE') return true; // CORE é sempre habilitado
  const modules = await this.getActiveModules(tenantId);
  return modules.includes(module);
}
```

### Verificação de feature flag

```typescript
async isFeatureEnabled(tenantId: string, flag: string): Promise<boolean> {
  const flags = await this.getTenantFlags(tenantId);
  return flags.get(flag) ?? false; // false por padrão se a flag não existir
}
```

### Limites do plano

```typescript
async getPlanLimits(tenantId: string): Promise<PlanLimits> {
  // Retorna: { maxUsers, maxWarehouses, maxProducts, maxStorageMb }
  // Defaults do plano FREE caso o tenant não tenha plano configurado
}
```

### Invalidação

Ao alterar o plano ou as flags de um tenant (via endpoints admin), o cache deve ser
limpo:

```typescript
tenantContextService.clearCache(tenantId); // Limpa apenas o tenant específico
tenantContextService.clearCache();          // Limpa todo o cache
```

---

## Permission Codes Organization

**Arquivo**: `src/constants/rbac/permission-codes.ts`

O objeto `PermissionCodes` oferece type-safety e autocomplete ao usar permissões nos
controllers. Está organizado por módulo:

```typescript
export const PermissionCodes = {
  SELF: { PROFILE: { READ, UPDATE, ... }, SESSIONS: { ... } },
  UI:   { MENU: { DASHBOARD, STOCK, HR, ... } },    // visibilidade de menus no frontend
  CORE: { USERS: { CREATE, READ, UPDATE, DELETE, LIST, MANAGE }, ... },
  RBAC: { PERMISSIONS: { ... }, GROUPS: { ... }, ASSIGNMENTS: { ... } },
  AUDIT: { LOGS: { READ, LIST, ... } },
  STOCK: { PRODUCTS: { ... }, VARIANTS: { ... }, BINS: { ... }, ... },
  SALES: { CUSTOMERS: { ... }, ORDERS: { ... }, ... },
  HR:    { EMPLOYEES: { READ_ALL, READ_TEAM, LIST_ALL, LIST_TEAM, ... }, ... },
  FINANCE: { ENTRIES: { ... }, BANK_ACCOUNTS: { ... }, ... },
  CALENDAR: { EVENTS: { ... }, PARTICIPANTS: { ... }, REMINDERS: { ... } },
  EMAIL: { ACCOUNTS: { ... }, MESSAGES: { ... }, ... },
  STORAGE: { FILES: { ... }, FOLDERS: { ... }, ... },
}
```

**Uso nos controllers**:

```typescript
import { PermissionCodes } from '@/constants/rbac';

createPermissionMiddleware({
  permissionCode: PermissionCodes.HR.EMPLOYEES.READ_ALL,
  resource: 'employees',
})
```

---

## Brute-Force Protection

**Arquivo**: `src/http/plugins/login-bruteforce-guard.plugin.ts`

Além da validade do JWT, o endpoint de login aplica proteção contra força bruta em dois
níveis:

| Nível | Mecanismo | Limite | Bloqueio |
|-------|-----------|--------|---------|
| Por IP | Redis (`login_fail:{ip}`) | 10 falhas | 15 minutos |
| Por usuário | Banco (`User.failedLoginAttempts`) | 5 falhas | 15 minutos (`blockedUntil`) |

O contador de IP é zerado no primeiro login bem-sucedido (`clearLoginFailures(ip)`).

---

## Files

| Arquivo | Propósito |
|---------|-----------|
| `src/@types/fastify-jwt.d.ts` | Tipagem do payload JWT (`FastifyJWT.user`) |
| `src/config/jwt.ts` | Configuração de algoritmo, TTLs, issuer, audience |
| `src/config/auth.ts` | Limites de tentativas, bloqueio, bcrypt rounds |
| `src/http/middlewares/rbac/verify-jwt.ts` | Middleware de validação do JWT + sessão |
| `src/http/middlewares/rbac/verify-tenant.ts` | Middleware que exige `tenantId` no JWT |
| `src/http/middlewares/rbac/verify-super-admin.ts` | Middleware que exige `isSuperAdmin` |
| `src/http/middlewares/rbac/verify-permission.ts` | Factories de middleware de permissão |
| `src/http/middlewares/rbac/verify-scope.ts` | Factory de middleware de escopo `.all`/`.team` |
| `src/http/middlewares/tenant/verify-module.ts` | Factory de middleware de módulo do plano |
| `src/http/middlewares/tenant/verify-feature-flag.ts` | Factory de middleware de feature flag |
| `src/services/rbac/permission-service.ts` | Lógica principal de verificação + cache L1/L2/L3 |
| `src/services/tenant/tenant-context-service.ts` | Contexto de tenant (plano, flags, limites) |
| `src/constants/rbac/permission-codes.ts` | Todos os códigos de permissão do sistema |
| `src/constants/rbac/permission-groups.ts` | Grupos padrão do sistema |
| `src/use-cases/core/sessions/create-session.ts` | Cria sessão e assina JWT global |
| `src/use-cases/core/tenants/select-tenant.ts` | Valida membership e assina JWT com tenantId |
| `src/http/controllers/core/auth/v1-authenticate-with-password.controller.ts` | Endpoint de login |
| `src/http/controllers/core/auth/v1-select-tenant.controller.ts` | Endpoint de seleção de tenant |
| `src/http/plugins/login-bruteforce-guard.plugin.ts` | Proteção de força bruta por IP |

---

## Rules

### Quando usar cada middleware

| Cenário | Middlewares |
|---------|-------------|
| Rota pública (health check) | Nenhum |
| Rota autenticada sem tenant (ex.: listar tenants do usuário) | `[verifyJwt]` |
| Rota de super admin | `[verifyJwt, verifySuperAdmin]` |
| Rota tenant-scoped padrão | `[verifyJwt, verifyTenant, createPermissionMiddleware(...)]` |
| Rota com verificação de módulo | `onRequest: createModuleMiddleware('MODULE')` + `preHandler: [verifyJwt, verifyTenant, createPermissionMiddleware(...)]` |
| Rota com feature flag | Adicionar `createFeatureFlagMiddleware('flag-name')` antes de `createPermissionMiddleware` |
| Listagem com escopo HR | Usar `createScopeIdentifierMiddleware` + lógica condicional no handler |

### Quando NÃO usar

- **Nunca aplicar `verifyTenant` em rotas admin** — super admins não possuem `tenantId`.
- **Nunca aplicar `verifySuperAdmin` em rotas tenant-scoped** — a separação de contextos
  é intencional e garante o isolamento.
- **Não usar `createPermissionMiddleware` sem `verifyJwt` antes** — `request.user.sub`
  estará indefinido.

### Armadilhas comuns

1. **Cache não invalidado após mudança de permissões**: Ao alterar grupos de permissão
   de um usuário via RBAC, o sistema invalida o cache automaticamente no use case
   correspondente. Se feito por acesso direto ao banco (ex.: migrations), o cache pode
   permanecer stale por até 5 minutos.

2. **JWT sem tenantId em rotas que exigem tenant**: O frontend deve sempre usar o token
   retornado pelo `select-tenant` (não o token inicial de login) para chamadas
   tenant-scoped.

3. **`verifyModule` no `onRequest` vs. `preHandler`**: O hook `onRequest` é executado
   antes da autenticação em algumas configurações. O middleware `createModuleMiddleware`
   trata isso com um guard explícito: se `request.user` não está definido ainda, ele
   retorna silenciosamente (a autenticação vai falhar no `preHandler`).

4. **Feature flags desabilitadas retornam `false` por padrão**: Flags inexistentes na
   tabela `TenantFeatureFlag` são tratadas como desabilitadas. Uma flag deve ser
   explicitamente criada e habilitada para que o middleware permita acesso.

5. **Singleton do PermissionService**: O singleton é criado por processo Node.js. Em
   ambientes com múltiplas instâncias (escalabilidade horizontal), o cache L1 é local
   por instância; o cache L2 (Redis) garante consistência entre instâncias.

---

## Audit History

| Date | Dimension | Score | Report |
|------|-----------|-------|--------|
| 2026-03-10 | Initial documentation | — | Criado com base na análise completa do código-fonte |
