# ADR-015: HTTP Caching Strategy (ETags, Cache-Control)

## Status: Accepted
## Date: 2026-03-10

## Context

A API OpenSea atende requisições de leitura frequentes, incluindo listagens de produtos, planos de assinatura, categorias financeiras e dados de usuário. Sem cache HTTP, cada request resulta em uma consulta ao banco de dados, mesmo quando os dados não mudaram.

Dois problemas específicos motivaram esta decisão:

1. **Endpoints públicos de planos** (`/v1/admin/plans`): acessados pelo frontend durante a seleção de tenant e por scripts de integração. Os dados mudam raramente mas são consultados com alta frequência.
2. **Endpoints autenticados de leitura**: cada listagem dispara queries ao banco; clientes bem-comportados que fazem polling podem ser otimizados com respostas `304 Not Modified`.

Foram avaliadas as seguintes abordagens:

1. **Cache Redis server-side por endpoint**: Eficaz mas requer invalidação explícita em cada mutação relacionada — alto custo de manutenção.
2. **Cache HTTP via `Cache-Control` e `ETag`**: Padrão HTTP nativo; o controle de validade fica no cliente (browser, CDN). Sem estado server-side adicional.
3. **CDN na frente da API**: Requer infraestrutura adicional e não resolve requests autenticados.

Optou-se por implementar cache HTTP padrão via Fastify plugin, complementado por um `CacheService` Redis para cache programático em serviços como `PermissionService`.

## Decision

### Plugin HTTP: `cache-control.plugin.ts`

Um plugin Fastify registrado globalmente (`src/http/plugins/cache-control.plugin.ts`) adiciona headers `Cache-Control` e `ETag` a respostas `GET 200`:

```typescript
// Regras de Cache-Control
const PUBLIC_PATTERNS = [
  /^\/v1\/admin\/plans$/,
  /^\/v1\/admin\/plans\/[^/]+$/,
];

const isPublic = PUBLIC_PATTERNS.some((p) => p.test(request.url));
const maxAge = isPublic ? 300 : 60;      // 5min público, 1min privado
const scope = isPublic ? 'public' : 'private';

reply.header('Cache-Control', `${scope}, max-age=${maxAge}`);
```

### Geração de ETag

O ETag é calculado como MD5 do payload JSON serializado:

```typescript
const etag = `"${createHash('md5').update(payload).digest('hex')}"`;
reply.header('ETag', etag);
```

### Suporte a 304 Not Modified

Se o cliente enviar `If-None-Match` com o ETag atual, a resposta é `304` com corpo vazio:

```typescript
const ifNoneMatch = request.headers['if-none-match'];
if (ifNoneMatch === etag) {
  reply.code(304);
  return done(null, '');
}
```

O header `ETag` é exposto via CORS (`exposedHeaders: ['ETag']` em `app.ts`) para que browsers possam lê-lo.

### Exceções (sem cache)

| Condição | Motivo |
|----------|--------|
| Métodos não-GET | Mutações nunca são cacheadas |
| `statusCode !== 200` | Erros e redirects não são cacheados |
| `/health` | Health checks não devem ser cacheados por proxies |
| `/docs`, `/swagger` | Interface de documentação tem seus próprios headers |

### Tabela de Comportamento por Endpoint

| Endpoint | `Cache-Control` | `max-age` | ETag |
|----------|----------------|-----------|------|
| `GET /v1/admin/plans` | `public` | 300s | Sim |
| `GET /v1/admin/plans/:id` | `public` | 300s | Sim |
| Qualquer outro `GET` autenticado | `private` | 60s | Sim |
| `POST`, `PUT`, `PATCH`, `DELETE` | — | — | Não |

### CacheService Redis (Programático)

Para cache server-side em serviços que precisam de controle granular (ex: `PermissionService`), existe um `RedisCacheService` (`src/services/cache/cache-service.ts`):

```typescript
export class RedisCacheService implements CacheService {
  async get<T>(key: string): Promise<T | null> { ... }
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> { ... }
  async del(key: string): Promise<void> { ... }
  async delPattern(pattern: string): Promise<number> { ... }
  async invalidateUserCache(userId: string): Promise<void> { ... }
}
```

O `PermissionService` usa três camadas de cache (L1 in-memory, L2 Redis, L3 banco), descritas em ADR-003.

### Registro na Aplicação

O plugin é registrado globalmente, desabilitado em ambiente de testes para evitar interferência:

```typescript
// src/app.ts
if (!isTestEnv) {
  app.register(cacheControlPlugin);
}
```

## Consequences

**Positive:**
- Endpoints de planos são cacheáveis por CDN e browsers sem nenhuma configuração adicional.
- Browsers e clientes HTTP que suportam `If-None-Match` economizam bandwidth em respostas não modificadas.
- Zero estado server-side adicional para o cache HTTP — não requer Redis para funcionar.
- A lógica de cache está centralizada em um único plugin, sem duplicação por rota.

**Negative:**
- O ETag baseado em MD5 do payload é um **weak cache validator**: não garante que os dados mudaram no banco, apenas que o payload serializado é diferente. Se dois estados distintos produzirem o mesmo JSON (ex: campos reordenados), o ETag será o mesmo.
- O `max-age=60` para endpoints autenticados significa que clientes podem ver dados desatualizados por até 60 segundos após uma mutação. Isso é aceitável para listas, mas não para dados críticos como status de pagamento.
- A lista de `PUBLIC_PATTERNS` precisa ser atualizada manualmente ao adicionar novos endpoints verdadeiramente públicos — não há mecanismo automático.
- O `CacheService` Redis usa `keys()` em `delPattern()`, que é O(N) no Redis. Em produção com muitas chaves, isso pode causar latência. Recomenda-se migrar para `SCAN` em grandes volumes.
