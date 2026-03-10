# ADR-014: Idempotency Keys Pattern

## Status: Accepted
## Date: 2026-03-10

## Context

Operações financeiras e outras mutações críticas são suscetíveis a duplicação causada por:

- **Retries automáticos do cliente**: Bibliotecas HTTP como `axios` e `fetch` com interceptor de retry reenviam a requisição em caso de timeout ou erro de rede.
- **Double-submit**: Usuário clica duas vezes no botão "Confirmar" antes do primeiro request retornar.
- **Problemas de rede**: A resposta é perdida em trânsito, mas o servidor já executou a operação. O cliente não sabe e reenvia.

Sem proteção, esses cenários resultam em entradas financeiras duplicadas, ordens de compra duplicadas ou outros efeitos colaterais repetidos.

Foram avaliadas as seguintes abordagens:

1. **Unicidade no banco de dados**: Exige que cada entidade tenha uma chave natural única, o que nem sempre é possível (ex: duas entradas financeiras com mesmo valor e data são legítimas).
2. **Token CSRF por formulário**: Protege apenas contra double-submit dentro da mesma sessão de formulário; não protege retries de rede em chamadas API.
3. **Idempotency Key no header**: Padrão adotado por Stripe, AWS, e outras APIs financeiras. O cliente gera um UUID único por operação e o envia em todas as tentativas da mesma operação.

## Decision

Implementar um **plugin Fastify de idempotency** (`src/http/plugins/idempotency.plugin.ts`) que intercepta requests `POST` e `PUT` com o header `Idempotency-Key` e armazena respostas bem-sucedidas em Redis.

### Fluxo de Execução

```
Cliente envia POST /v1/finance/entries
  com header: Idempotency-Key: uuid-gerado-pelo-cliente

  [preHandler hook]
  → Busca idem:{key} no Redis
  → Se encontrado: retorna resposta cacheada imediatamente
      com header X-Idempotency-Replayed: true
  → Se não encontrado: executa o handler normalmente

  [onSend hook — após o handler executar]
  → Se statusCode < 400 e não é replay:
      armazena { statusCode, body } em idem:{key} com TTL 24h
```

### Implementação

```typescript
// src/http/plugins/idempotency.plugin.ts
const IDEMPOTENCY_TTL = 86400;        // 24 horas
const IDEMPOTENCY_HEADER = 'idempotency-key';

// preHandler: checar cache antes de executar
const cached = await redis.get(`idem:${key}`);
if (cached) {
  const { statusCode, body } = JSON.parse(cached);
  reply.header('X-Idempotency-Replayed', 'true');
  return reply.status(statusCode).send(body);
}

// onSend: armazenar resposta de sucesso
if (reply.statusCode < 400 && !reply.getHeader('X-Idempotency-Replayed')) {
  await redis.set(`idem:${key}`, JSON.stringify({ statusCode, body }), 'EX', IDEMPOTENCY_TTL);
}
```

### Regras de Cache

| Condição | Comportamento |
|----------|---------------|
| `GET`, `PATCH`, `DELETE` | Ignorado (idempotency não se aplica) |
| `POST`/`PUT` sem header | Ignorado (opt-in) |
| `POST`/`PUT` com header, primeiro request | Handler executado, resposta armazenada por 24h |
| `POST`/`PUT` com header, request repetido | Resposta cacheada retornada sem executar handler |
| Resposta com `statusCode >= 400` | Não armazenada (erros de validação não são cacheados) |
| Redis indisponível | Fail-open: handler executado normalmente sem idempotency |

### Header de Confirmação

Respostas de replay incluem `X-Idempotency-Replayed: true`, permitindo que o cliente distinga entre uma resposta nova e uma resposta cacheada.

### Registro na Aplicação

O plugin é registrado globalmente no startup da aplicação, desabilitado em ambiente de testes:

```typescript
// src/app.ts
if (!isTestEnv) {
  app.register(idempotencyPlugin);
}
```

### Responsabilidade do Cliente

O cliente é responsável por:
1. Gerar um UUID v4 único por operação (não por tentativa).
2. Reutilizar o mesmo UUID em todas as tentativas da mesma operação.
3. Usar um novo UUID para operações distintas.

Exemplo de uso no frontend:

```typescript
const idempotencyKey = crypto.randomUUID();

await api.post('/v1/finance/entries', payload, {
  headers: { 'Idempotency-Key': idempotencyKey },
});
```

## Consequences

**Positive:**
- Operações financeiras e outras mutações críticas são protegidas contra duplicação por retry.
- O padrão é opt-in (requer header) — operações que não precisam de idempotency não têm overhead.
- Fail-open: quando Redis está indisponível, o sistema funciona normalmente sem idempotency.
- Compatível com o padrão usado por Stripe, AWS e outras APIs financeiras — familiar aos desenvolvedores.

**Negative:**
- A janela de proteção é de 24 horas. Retries após esse período não são protegidos.
- Erros de validação (4xx) não são cacheados, o que é correto mas significa que um request com payload inválido sempre executa o handler mesmo com a mesma chave.
- O plugin não valida o formato do `Idempotency-Key` — qualquer string é aceita. Clientes que reutilizarem acidentalmente a mesma chave para operações distintas receberão uma resposta incorreta.
- Em cenários de alta concorrência, dois requests com a mesma chave chegando simultaneamente (antes que o primeiro seja armazenado) podem ambos executar o handler. A proteção é eventual, não atômica.
