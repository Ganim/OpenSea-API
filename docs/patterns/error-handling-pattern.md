# Pattern: Error Handling

## Problem

Em uma API REST com múltiplas camadas (HTTP, Use Cases, Domain), erros de naturezas distintas
precisam ser comunicados de forma consistente ao cliente. Sem um padrão centralizado, cada
controller poderia retornar formatos de resposta diferentes, dificultando o tratamento de erros
no frontend e em logs. Além disso, erros de domínio (ex.: "recurso não encontrado") não devem
vazar detalhes de infraestrutura para o cliente.

Os desafios específicos que este padrão resolve:

- Retornar o código HTTP correto para cada tipo de erro de domínio
- Incluir um `code` legível por máquina para que o frontend possa reagir programaticamente
- Correlacionar erros em logs e suporte via `requestId`
- Capturar apenas erros inesperados no Sentry (não erros de negócio esperados)
- Evitar que detalhes internos sejam expostos em produção

---

## Solution

O sistema usa uma hierarquia de classes de erro tipadas que são lançadas pelos Use Cases e
capturadas de forma centralizada pelo `errorHandler` do Fastify. Os controllers capturam
apenas erros que precisam de respostas personalizadas (ex.: 404 com corpo específico); todos
os demais são propagados para o handler global.

### Fluxo de tratamento

```
Use Case lança um erro de domínio (ex.: ResourceNotFoundError)
         ↓
Controller captura e retorna status HTTP específico (ex.: 404)
         ↓ (se não capturado pelo controller)
errorHandler global mapeia a classe de erro para status HTTP e ErrorCode
         ↓
Resposta JSON: { message, code, requestId }
         ↓ (se erro inesperado)
errorLogger.error() + captureException() no Sentry
```

### Estrutura de resposta padrão

Toda resposta de erro segue o formato:

```json
{
  "message": "Finance category not found",
  "code": "FINANCE_CATEGORY_NOT_FOUND",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

Erros de validação Zod incluem um campo adicional `details` com a árvore de erros:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Validation error",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "details": { ... }
}
```

O `requestId` é gerado pelo plugin `request-id.plugin.ts` e retornado também no header
`X-Request-Id` de todas as respostas.

---

## Implementation

### 1. Classes de erro de domínio (`src/@errors/use-cases/`)

Cada classe herda de `Error` e serve como marcador de tipo para o handler:

```typescript
// src/@errors/use-cases/resource-not-found.ts
import type { ErrorCode } from '../error-codes';

export class ResourceNotFoundError extends Error {
  public readonly code?: ErrorCode;

  constructor(message: string = 'Resource not found', code?: ErrorCode) {
    super(message);
    this.code = code;
  }
}
```

```typescript
// src/@errors/use-cases/bad-request-error.ts
import type { ErrorCode } from '../error-codes';

export class BadRequestError extends Error {
  public readonly code?: ErrorCode;

  constructor(message: string = 'Bad request error', code?: ErrorCode) {
    super(message);
    this.code = code;
  }
}
```

Ambas aceitam um `ErrorCode` opcional que, quando fornecido, substitui o código genérico na
resposta. Isso permite erros de negócio altamente específicos sem criar uma nova classe.

#### Hierarquia de classes

```
Error (nativo)
  ├── BadRequestError           → HTTP 400 (+ code opcional)
  ├── UnauthorizedError         → HTTP 401
  ├── ForbiddenError            → HTTP 403
  │   ├── UserBlockedError      → HTTP 403 (+ blockedUntil: Date)
  │   ├── PasswordResetRequiredError → HTTP 403 (+ resetToken, reason)
  │   └── PinSetupRequiredError → HTTP 403 (+ pinType)
  ├── ResourceNotFoundError     → HTTP 404 (+ code opcional)
  └── PlanLimitExceededError    → HTTP 413 (via controller)

// Erros de domínio específicos (volumes):
Error
  ├── VolumeNotFoundError       → HTTP 404
  ├── VolumeAlreadyExistsError  → HTTP 409
  ├── VolumeItemNotFoundError   → HTTP 404
  ├── VolumeItemAlreadyExistsError → HTTP 409
  ├── VolumeCannotBeClosed      → HTTP 400
  └── InvalidVolumeStatusError  → HTTP 400
```

### 2. Códigos de erro (`src/@errors/error-codes.ts`)

O objeto `ErrorCodes` centraliza todos os códigos legíveis por máquina:

```typescript
export const ErrorCodes = {
  // Genéricos
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',

  // Autenticação
  USER_BLOCKED: 'USER_BLOCKED',
  PASSWORD_RESET_REQUIRED: 'PASSWORD_RESET_REQUIRED',
  PIN_SETUP_REQUIRED: 'PIN_SETUP_REQUIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',

  // Multi-tenant
  PLAN_LIMIT_EXCEEDED: 'PLAN_LIMIT_EXCEEDED',
  CROSS_TENANT: 'CROSS_TENANT',

  // Finanças (exemplos de códigos de domínio específico)
  FINANCE_CATEGORY_MAX_DEPTH: 'FINANCE_CATEGORY_MAX_DEPTH',
  FINANCE_CATEGORY_HAS_CHILDREN: 'FINANCE_CATEGORY_HAS_CHILDREN',
  FINANCE_CATEGORY_NOT_FOUND: 'FINANCE_CATEGORY_NOT_FOUND',
  // ...
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
```

O tipo `ErrorCode` garante que apenas valores definidos em `ErrorCodes` possam ser usados nos
construtores de `ResourceNotFoundError` e `BadRequestError`.

### 3. Handler global (`src/@errors/error-handler.ts`)

Registrado em `app.ts` via `app.setErrorHandler(errorHandler)`. Recebe todos os erros não
capturados pelos controllers:

```typescript
export const errorHandler = (
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const requestId = request.requestId;

  // Erros de validação do Fastify/Zod
  if (error.code === 'FST_ERR_VALIDATION') {
    return reply.status(400).send({
      code: ErrorCodes.VALIDATION_ERROR,
      message: error.message,
      requestId,
    });
  }

  if (error instanceof ZodError) {
    return reply.status(400).send({
      code: ErrorCodes.VALIDATION_ERROR,
      message: 'Validation error',
      requestId,
      details: z.treeifyError(error),
    });
  }

  // Erros de negócio
  if (error instanceof ResourceNotFoundError) {
    return reply.status(404).send({
      code: error.code ?? ErrorCodes.RESOURCE_NOT_FOUND,
      message: error.message,
      requestId,
    });
  }

  // ... demais classes mapeadas ...

  // Erros inesperados: loga + envia ao Sentry
  errorLogger.error({ error: { message: error.message, stack: error.stack } }, 'Internal server error');

  captureException(error, {
    userId: request.user?.sub,
    endpoint: request.url,
    method: request.method,
    extra: { requestId, params: request.params, query: request.query },
  });

  return reply.status(500).send({
    code: ErrorCodes.INTERNAL_ERROR,
    message: 'Internal server error',
    requestId,
    // Em desenvolvimento, inclui detalhes; em produção, omite
    ...(env.NODE_ENV !== 'production' && { details: error.message }),
  });
};
```

**Observação sobre Sentry:** Os erros de domínio esperados (`UnauthorizedError`,
`ResourceNotFoundError`, `BadRequestError`, etc.) estão na lista `ignoreErrors` do Sentry
(`src/lib/sentry.ts`). Somente erros verdadeiramente inesperados (HTTP 500) são capturados.

### 4. Uso nos Use Cases

Use cases lançam erros tipados. Eles **nunca** retornam códigos HTTP — apenas descrevem o
problema semanticamente:

```typescript
// src/use-cases/finance/categories/delete-finance-category.ts
async execute({ tenantId, id, replacementCategoryId }) {
  const category = await this.categoriesRepository.findById(new UniqueEntityID(id), tenantId);

  if (!category) {
    throw new ResourceNotFoundError(
      'Finance category not found',
      ErrorCodes.FINANCE_CATEGORY_NOT_FOUND,
    );
  }

  if (category.isSystem) {
    throw new BadRequestError(
      'System categories cannot be deleted',
      ErrorCodes.FINANCE_CATEGORY_IS_SYSTEM,
    );
  }

  if (children.length > 0) {
    throw new BadRequestError(
      'Cannot delete a category that has child categories. Delete or move children first.',
      ErrorCodes.FINANCE_CATEGORY_HAS_CHILDREN,
    );
  }
  // ...
}
```

Use cases de autenticação lançam erros com dados estruturados:

```typescript
// src/use-cases/core/auth/authenticate-with-password.ts
if (existingUser.forcePasswordReset) {
  throw new PasswordResetRequiredError({
    userId: existingUser.id.toString(),
    reason: existingUser.forcePasswordResetReason,
    resetToken: tempResetToken,
    requestedAt: existingUser.forcePasswordResetRequestedAt,
  });
}
```

### 5. Uso nos Controllers

Existem dois padrões de tratamento nos controllers:

**Padrão A — Captura local com resposta personalizada** (mais comum):

```typescript
// src/http/controllers/stock/products/v1-get-product-by-id.controller.ts
handler: async (request, reply) => {
  try {
    const { product } = await getProductByIdUseCase.execute({ tenantId, id: productId });
    return reply.status(200).send({ product: productToDTO(product) });
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: error.message });
    }
    throw error;  // Propaga para o errorHandler global
  }
},
```

**Padrão B — Múltiplos tipos de erro com status distintos** (ex.: upload de arquivo):

```typescript
// src/http/controllers/storage/files/v1-upload-file.controller.ts
} catch (error) {
  if (error instanceof BadRequestError) {
    return reply.status(400).send({ message: error.message });
  }
  if (error instanceof ResourceNotFoundError) {
    return reply.status(404).send({ message: error.message });
  }
  if (error instanceof PlanLimitExceededError) {
    return reply.status(413).send({ message: error.message });
  }
  throw error;
}
```

**Regra crítica:** todo bloco `catch` deve sempre terminar com `throw error` para que erros
não previstos sejam tratados pelo handler global (e capturados pelo Sentry).

### 6. Plugin de Request ID (`src/http/plugins/request-id.plugin.ts`)

Adicionado como primeiro plugin no ciclo de vida do Fastify. Gera um UUID v4 por requisição
(ou reutiliza o `X-Request-Id` enviado pelo cliente) e o expõe como `request.requestId`:

```typescript
app.addHook('onRequest', async (request, reply) => {
  const requestId =
    (request.headers['x-request-id'] as string) || randomUUID();
  request.requestId = requestId;
  reply.header('x-request-id', requestId);
});
```

O `requestId` é incluído em todas as respostas de erro e nos logs estruturados (Pino), permitindo
rastrear uma requisição do frontend até os logs do servidor.

### 7. Middlewares que lançam erros

Os middlewares de autenticação e autorização seguem o mesmo padrão e lançam os erros corretos:

```typescript
// src/http/middlewares/rbac/verify-jwt.ts
export async function verifyJwt(request: FastifyRequest) {
  try {
    await request.jwtVerify();
    // ...verificação de sessão...
  } catch (error) {
    if (error instanceof UnauthorizedError) throw error;
    throw new UnauthorizedError('User not authorized');
  }
}

// src/http/middlewares/rbac/verify-tenant.ts
export async function verifyTenant(request: FastifyRequest) {
  if (!user?.tenantId) {
    throw new ForbiddenError(
      'No tenant selected. Please select a tenant first via POST /v1/auth/select-tenant',
    );
  }
}

// src/http/middlewares/rbac/verify-permission.ts
if (!result.allowed) {
  throw new ForbiddenError(
    `Permission denied: ${options.permissionCode}. ${result.reason}`,
  );
}
```

---

## Files

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/@errors/error-codes.ts` | Todos os códigos de erro legíveis por máquina |
| `src/@errors/error-handler.ts` | Handler global do Fastify — mapeamento de classe → HTTP status |
| `src/@errors/use-cases/resource-not-found.ts` | Erro de recurso não encontrado |
| `src/@errors/use-cases/bad-request-error.ts` | Erro de requisição inválida |
| `src/@errors/use-cases/forbidden-error.ts` | Erro de acesso negado |
| `src/@errors/use-cases/unauthorized-error.ts` | Erro de não autenticado |
| `src/@errors/use-cases/user-blocked-error.ts` | Conta bloqueada por tentativas de login |
| `src/@errors/use-cases/password-reset-required-error.ts` | Reset de senha obrigatório |
| `src/@errors/use-cases/pin-setup-required-error.ts` | Configuração de PIN obrigatória |
| `src/@errors/use-cases/plan-limit-exceeded-error.ts` | Limite do plano excedido |
| `src/@errors/volumes-errors.ts` | Erros específicos do módulo de volumes |
| `src/http/plugins/request-id.plugin.ts` | Geração e propagação do X-Request-Id |
| `src/lib/logger.ts` | Logger Pino (httpLogger, errorLogger, etc.) |
| `src/lib/sentry.ts` | Captura de exceções inesperadas no Sentry |
| `src/app.ts` | Registro do errorHandler via `app.setErrorHandler()` |

**Exemplos de controllers com tratamento:**
- `src/http/controllers/stock/products/v1-get-product-by-id.controller.ts` — Padrão A (404)
- `src/http/controllers/stock/products/v1-delete-product.controller.ts` — Padrão A (404)
- `src/http/controllers/storage/files/v1-upload-file.controller.ts` — Padrão B (múltiplos status)

**Exemplos de use cases com lançamento de erros:**
- `src/use-cases/finance/categories/delete-finance-category.ts` — múltiplos erros por regra
- `src/use-cases/finance/categories/create-finance-category.ts` — validações encadeadas
- `src/use-cases/core/auth/authenticate-with-password.ts` — erros com dados estruturados

---

## Mapeamento completo: classe → HTTP status → ErrorCode

| Classe | HTTP Status | `code` padrão | `code` pode ser substituído? |
|--------|-------------|---------------|------------------------------|
| `ZodError` / `FST_ERR_VALIDATION` | 400 | `VALIDATION_ERROR` | Não |
| `BadRequestError` | 400 | `BAD_REQUEST` | Sim (via `code` no construtor) |
| `UnauthorizedError` | 401 | `UNAUTHORIZED` | Não |
| `ForbiddenError` | 403 | `FORBIDDEN` | Não |
| `UserBlockedError` | 403 | `USER_BLOCKED` | Não |
| `PasswordResetRequiredError` | 403 | `PASSWORD_RESET_REQUIRED` | Não |
| `ResourceNotFoundError` | 404 | `RESOURCE_NOT_FOUND` | Sim |
| `VolumeNotFoundError` | 404 | `VOLUME_NOT_FOUND` | Não |
| `VolumeItemNotFoundError` | 404 | `VOLUME_ITEM_NOT_FOUND` | Não |
| `VolumeAlreadyExistsError` | 409 | `VOLUME_ALREADY_EXISTS` | Não |
| `VolumeItemAlreadyExistsError` | 409 | `VOLUME_ITEM_ALREADY_EXISTS` | Não |
| `VolumeCannotBeClosed` | 400 | `VOLUME_CANNOT_BE_CLOSED` | Não |
| `InvalidVolumeStatusError` | 400 | `INVALID_VOLUME_STATUS` | Não |
| Rate limit (429) | 429 | `RATE_LIMITED` | Não |
| `PlanLimitExceededError` | 413 | (via controller, sem code) | — |
| Qualquer outro erro | 500 | `INTERNAL_ERROR` | Não |

**Nota:** `PlanLimitExceededError` não está no handler global — é tratado individualmente nos
controllers que precisam retornar 413. Em produção, o `details` é omitido dos erros 500.

---

## Frontend Error Boundaries (OpenSea-APP)

O frontend Next.js possui 4 arquivos `error.tsx` como Error Boundaries do React Server Components,
um por route group:

| Arquivo | Route Group | Comportamento |
|---------|-------------|---------------|
| `src/app/error.tsx` | Global (raiz) | "Algo deu errado" — fallback máximo |
| `src/app/(dashboard)/error.tsx` | Dashboard | "Erro ao carregar a página" + botão home |
| `src/app/(central)/error.tsx` | Central (admin) | "Erro no painel administrativo" + botão `/central` |
| `src/app/(auth)/error.tsx` | Auth | "Erro na autenticação" + botão `/login` |

Todos os error boundaries exibem o `error.digest` (hash gerado pelo Next.js para correlação
server-side) quando disponível, permitindo rastrear o erro nos logs do servidor:

```tsx
{error.digest && (
  <p className="text-xs text-slate-400 font-mono">
    Referência: {error.digest}
  </p>
)}
```

Além do arquivo `not-found.tsx` global em `src/app/not-found.tsx` para rotas inexistentes.

### Tratamento de erros de API no cliente (`src/lib/errors/`)

O frontend possui um sistema próprio de tipagem de erros de API:

```typescript
// src/lib/errors/api-error.ts
export class ApiError extends Error {
  readonly type: ApiErrorType;  // 'VALIDATION' | 'AUTHENTICATION' | 'AUTHORIZATION' | 'NOT_FOUND' | ...
  readonly status: number;
  readonly code?: string;       // Código vindo do backend (ex.: 'FINANCE_CATEGORY_NOT_FOUND')
  readonly fieldErrors?: ValidationFieldError[];
}
```

A classificação por `type` é derivada do status HTTP:

```typescript
static getTypeFromStatus(status: number): ApiErrorType {
  if (status === 400) return 'VALIDATION';
  if (status === 401) return 'AUTHENTICATION';
  if (status === 403) return 'AUTHORIZATION';
  if (status === 404) return 'NOT_FOUND';
  if (status === 409) return 'CONFLICT';
  if (status === 429) return 'RATE_LIMIT';
  if (status >= 500) return 'SERVER';
  return 'UNKNOWN';
}
```

As mensagens em inglês do backend são traduzidas para o português via `translateError()` de
`src/lib/errors/error-messages.ts` (ou o mapa legado em `src/lib/error-messages.ts`).

Para toasts de erro padronizados, usa-se `showErrorToast()` de `src/lib/toast-utils.ts`, que
inclui um botão "Copiar erro" para facilitar o suporte ao usuário.

---

## Rules

**Quando usar cada classe:**

- `ResourceNotFoundError` — entidade não existe ou não pertence ao tenant atual
- `BadRequestError` — regra de negócio violada (ex.: hierarquia muito profunda, categoria sistema)
- `ForbiddenError` — usuário autenticado mas sem permissão para a operação
- `UnauthorizedError` — sem token válido ou sessão revogada
- `UserBlockedError` — conta bloqueada por excesso de tentativas de login
- `PlanLimitExceededError` — tenant atingiu limite do plano (armazenamento, usuários, etc.)

**Quando NÃO usar o handler global diretamente:**

Nunca importe `errorHandler` nos controllers. Deixe o Fastify invocar automaticamente via
`throw error`.

**Regra dos códigos específicos:**

Sempre use um `ErrorCode` específico quando o frontend precisa reagir de forma distinta ao erro
(ex.: mostrar modal de upgrade para `PLAN_LIMIT_EXCEEDED`, redirecionar para redefinição de
senha para `PASSWORD_RESET_REQUIRED`). Use o código genérico apenas para erros informativos.

**Propagação obrigatória:**

Todo `catch` em controller **deve** terminar com `throw error` após os `instanceof` esperados.
Omitir esse `throw` faz com que erros inesperados sejam silenciados e retornem HTTP 200 vazio.

```typescript
// CORRETO
} catch (error) {
  if (error instanceof ResourceNotFoundError) {
    return reply.status(404).send({ message: error.message });
  }
  throw error; // Não esquecer
}

// ERRADO — engole erros inesperados
} catch (error) {
  if (error instanceof ResourceNotFoundError) {
    return reply.status(404).send({ message: error.message });
  }
  // Sem throw: outros erros retornam 200 vazio
}
```

**Adicionando um novo código de erro:**

1. Adicionar o código em `src/@errors/error-codes.ts`
2. Criar nova classe em `src/@errors/use-cases/` (se necessário) **ou** usar `BadRequestError`/`ResourceNotFoundError` com o `code` novo
3. Adicionar o mapeamento em `error-handler.ts` (se a nova classe precisar de status diferente de 400/404)
4. Atualizar `ignoreErrors` no Sentry se for um erro de domínio esperado

## Audit History

| Date | Dimension | Score | Report |
|------|-----------|-------|--------|
| 2026-03-10 | Pattern Documentation | — | Criação inicial |
