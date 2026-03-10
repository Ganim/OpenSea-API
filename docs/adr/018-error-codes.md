# ADR-018: Error Codes Standardization

## Status: Accepted
## Date: 2026-03-10

## Context

Antes desta decisão, as respostas de erro da API retornavam apenas uma mensagem textual em inglês:

```json
{ "message": "Resource not found" }
```

Isso criava dois problemas:

1. **Frontend dependente de parsing de strings**: Para exibir mensagens de erro em português ou executar lógica condicional (ex: redirecionar ao criar PIN), o frontend precisava fazer match em strings de mensagem, que são frágeis e quebram em qualquer refatoração do backend.

2. **Ausência de rastreabilidade**: Erros inesperados em produção não tinham identificador de correlação, tornando difícil associar logs de servidor a um report de usuário.

Adicionalmente, o sistema de multi-tenancy e autenticação gerava erros com dados extras (ex: `blockedUntil`, `resetToken`) que precisavam ser transportados de forma estruturada além da mensagem.

Foram avaliadas as seguintes abordagens:

1. **Manter apenas `message`**: Simples, mas obriga o frontend a parsear strings.
2. **Códigos numéricos (ex: `4001`, `4002`)**: Difíceis de lembrar e depurar sem tabela de referência.
3. **Códigos string em UPPER_SNAKE_CASE**: Autodescritivos, usados por Stripe, AWS e outros. Fáceis de buscar no código.

## Decision

Todas as respostas de erro da API incluem dois campos obrigatórios:

```json
{
  "code": "RESOURCE_NOT_FOUND",
  "message": "Product with id abc-123 not found",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Catálogo de Códigos

Os códigos são definidos como constantes em `src/@errors/error-codes.ts`:

```typescript
export const ErrorCodes = {
  // Genéricos
  VALIDATION_ERROR:     'VALIDATION_ERROR',
  BAD_REQUEST:          'BAD_REQUEST',
  UNAUTHORIZED:         'UNAUTHORIZED',
  FORBIDDEN:            'FORBIDDEN',
  RESOURCE_NOT_FOUND:   'RESOURCE_NOT_FOUND',
  CONFLICT:             'CONFLICT',
  RATE_LIMITED:         'RATE_LIMITED',
  INTERNAL_ERROR:       'INTERNAL_ERROR',

  // Auth
  USER_BLOCKED:                'USER_BLOCKED',
  PASSWORD_RESET_REQUIRED:     'PASSWORD_RESET_REQUIRED',
  PIN_SETUP_REQUIRED:          'PIN_SETUP_REQUIRED',
  INVALID_CREDENTIALS:         'INVALID_CREDENTIALS',

  // Multi-tenant
  PLAN_LIMIT_EXCEEDED:  'PLAN_LIMIT_EXCEEDED',
  CROSS_TENANT:         'CROSS_TENANT',

  // Finance
  FINANCE_CATEGORY_MAX_DEPTH:              'FINANCE_CATEGORY_MAX_DEPTH',
  FINANCE_CATEGORY_REPLACEMENT_REQUIRED:   'FINANCE_CATEGORY_REPLACEMENT_REQUIRED',
  FINANCE_CATEGORY_REPLACEMENT_NOT_FOUND:  'FINANCE_CATEGORY_REPLACEMENT_NOT_FOUND',
  FINANCE_CATEGORY_SELF_REPLACEMENT:       'FINANCE_CATEGORY_SELF_REPLACEMENT',
  FINANCE_CATEGORY_IS_SYSTEM:              'FINANCE_CATEGORY_IS_SYSTEM',
  FINANCE_CATEGORY_HAS_CHILDREN:           'FINANCE_CATEGORY_HAS_CHILDREN',
  FINANCE_CATEGORY_NOT_FOUND:              'FINANCE_CATEGORY_NOT_FOUND',
  FINANCE_CATEGORY_DUPLICATE_SLUG:         'FINANCE_CATEGORY_DUPLICATE_SLUG',
  FINANCE_BANK_ACCOUNT_NOT_FOUND:          'FINANCE_BANK_ACCOUNT_NOT_FOUND',
  FINANCE_COST_CENTER_NOT_FOUND:           'FINANCE_COST_CENTER_NOT_FOUND',
  FINANCE_RATEIO_INVALID_PERCENTAGE:       'FINANCE_RATEIO_INVALID_PERCENTAGE',
  FINANCE_RATEIO_CONFLICT:                 'FINANCE_RATEIO_CONFLICT',

  // Stock / Volumes
  VOLUME_NOT_FOUND:           'VOLUME_NOT_FOUND',
  VOLUME_ALREADY_EXISTS:      'VOLUME_ALREADY_EXISTS',
  VOLUME_CANNOT_BE_CLOSED:    'VOLUME_CANNOT_BE_CLOSED',
  VOLUME_ITEM_NOT_FOUND:      'VOLUME_ITEM_NOT_FOUND',
  VOLUME_ITEM_ALREADY_EXISTS: 'VOLUME_ITEM_ALREADY_EXISTS',
  INVALID_VOLUME_STATUS:      'INVALID_VOLUME_STATUS',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
```

### Integração com Classes de Erro

As classes de erro do domínio (`BadRequestError`, `ResourceNotFoundError`) aceitam um `ErrorCode` opcional:

```typescript
export class BadRequestError extends Error {
  public readonly code?: ErrorCode;

  constructor(message: string = 'Bad request error', code?: ErrorCode) {
    super(message);
    this.code = code;
  }
}
```

Uso em use cases:

```typescript
throw new BadRequestError(
  'Finance category maximum depth exceeded',
  ErrorCodes.FINANCE_CATEGORY_MAX_DEPTH,
);
```

### Error Handler Centralizado

O `errorHandler` (`src/@errors/error-handler.ts`) mapeia cada tipo de exceção para o código correto:

```typescript
if (error instanceof ResourceNotFoundError) {
  return reply.status(404).send({
    code: error.code ?? ErrorCodes.RESOURCE_NOT_FOUND,
    message: error.message,
    requestId,
  });
}
```

### Request ID

Cada request recebe um UUID único via `requestIdPlugin` (`src/http/plugins/request-id.plugin.ts`):

- Se o cliente enviar `X-Request-Id`, esse valor é reutilizado (útil para rastreamento end-to-end).
- Caso contrário, um UUID v4 é gerado.
- O ID é retornado no header `X-Request-Id` da resposta e incluído no body de todos os erros.

### Erros com Payload Extra

Alguns erros incluem campos adicionais estruturados:

```json
// USER_BLOCKED
{
  "code": "USER_BLOCKED",
  "message": "Usuário bloqueado por excesso de tentativas",
  "requestId": "...",
  "blockedUntil": "2026-03-10T15:30:00.000Z"
}

// PASSWORD_RESET_REQUIRED
{
  "code": "PASSWORD_RESET_REQUIRED",
  "message": "Troca de senha obrigatória",
  "requestId": "...",
  "resetToken": "...",
  "reason": "ADMIN_RESET",
  "requestedAt": "2026-03-09T10:00:00.000Z"
}
```

### Convenção de Nomenclatura para Novos Códigos

| Padrão | Exemplo |
|--------|---------|
| Genérico | `VALIDATION_ERROR`, `CONFLICT` |
| Por módulo | `{MODULO}_{ENTIDADE}_{PROBLEMA}` |
| Exemplo Stock | `VOLUME_ITEM_NOT_FOUND` |
| Exemplo Finance | `FINANCE_CATEGORY_MAX_DEPTH` |

Nunca reutilizar um código existente para um novo significado — adicionar um novo código em `error-codes.ts`.

## Consequences

**Positive:**
- O frontend pode usar `switch (error.code)` em vez de `error.message.includes(...)` para lógica condicional.
- Internacionalização (i18n) de mensagens de erro no frontend é trivial: um mapa `ErrorCode → string PT-BR` na camada de apresentação.
- O `requestId` em cada resposta de erro permite correlação direta com logs do servidor no Sentry e Pino.
- O `ErrorCode` é um tipo TypeScript (`type ErrorCode = ...`), garantindo que apenas códigos definidos sejam usados no código.

**Negative:**
- Adicionar um novo erro de domínio requer atualizar `error-codes.ts` e o `error-handler.ts`. Para erros muito específicos de um módulo, isso pode parecer verboso.
- O catálogo em `error-codes.ts` cresce com o sistema. Com 36 códigos já definidos e vários módulos sem cobertura completa (ex: HR, Sales, RBAC), o arquivo pode se tornar extenso.
- Erros sem `code` explícito nos use cases recebem o código genérico do handler (`BAD_REQUEST`, `RESOURCE_NOT_FOUND`). Isso é aceitável mas reduz a granularidade para o frontend — requer disciplina dos desenvolvedores ao lançar exceções.
- A tipagem `ErrorCode` é eficaz dentro do backend mas não é diretamente exportada para o frontend (que não tem acesso a `src/@errors/error-codes.ts`). O frontend deve manter uma cópia do enum ou usar strings literais.
