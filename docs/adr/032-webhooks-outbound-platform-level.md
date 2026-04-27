# ADR-032: Webhooks outbound — platform-level (system.\*) com 4-níveis de RBAC

Status: Accepted (2026-04-27, Phase 11-01)
Supersedes: —
Related: ADR-024 (parsePermissionCode 3+4 níveis), ADR-027 (typedEventBus), ADR-031 (4-níveis fora de tools — hr.compliance, hr.punch.audit)

## Contexto

A Phase 11 entrega **webhooks outbound** para clientes externos integrarem com o OpenSea (sistemas de BI, folha de pagamento de terceiros, integração customizada). As decisões fundadoras estão travadas em `.planning/phases/11-webhooks-outbound/11-CONTEXT.md` (D-01..D-36).

Antes de Plan 11-01 não havia infraestrutura de webhooks outbound. O módulo `notifications` cobre delivery interna (in-app, push, email, SMS), mas não delivery HTTP outbound com HMAC, retry exponencial e auto-disable.

V1 expõe somente **eventos `punch.*`** mas a infra serve qualquer evento futuro (`sales.*`, `finance.*`) sem refactor. Plan 11-01 (este wave 0) estabelece os contratos type-safe + DB schema; Plan 11-02 implementa o backend completo (use cases, controllers, worker, consumers); Plan 11-03 entrega a UI admin (`/devices/webhooks`).

## Decisão

### 1. Namespace `system.*` (não `hr.*`)

Webhooks são **plataforma-level**, não específicos do módulo HR. Embora V1 só exponha eventos `punch.*`, em V2 outros módulos (sales, finance) plugam no mesmo registry sem refactor (D-11). Permission: **`system.webhooks.endpoints.*`** — quarto cluster 4-níveis fora de `tools.*` (depois de `hr.compliance.*`, `hr.punch.audit.*`).

`parsePermissionCode('system.webhooks.endpoints.access')` retorna `{ module: 'system', resource: 'webhooks.endpoints', action: 'access' }` (sub-resource absorvido em resource — ADR-024).

### 2. Stripe-style envelope + header

Envelope (D-15):

```json
{
  "id": "evt_<ulid>",
  "type": "punch.time-entry.created",
  "created_at": "2026-04-27T13:45:30Z",
  "tenant_id": "tnt_<uuid>",
  "api_version": "2026-04-27",
  "data": { "object": "...", "...": "..." },
  "delivery": { "attempt": 1, "webhook_id": "whk_<ulid>" }
}
```

Header `X-OpenSea-Signature: t=<unix_seconds>,v1=<hex_64>` (D-04). O prefixo `v1=` permite versionar o algoritmo HMAC (ex: `v2=` para HMAC-SHA512 ou Ed25519) no futuro sem quebrar clientes legados — quando a feature flag for ativada, o serviço assina com **ambos** v1+v2 durante uma janela de migração.

Anti-replay: cliente DEVE rejeitar entregas com `t` (header) > 5min de diferença do clock atual (D-06).

### 3. Anti-SSRF V1 — TOCTOU 2-pass

Defesa em camadas (D-31):

- **Em produção**: força `https://`; bloqueia hosts cujos resolves DNS apontem para 10/8, 172.16/12, 192.168/16, 127/8, 169.254/16 (AWS metadata!), ::1, fc00::/7, fe80::/10. Validação executada **no momento da criação** do endpoint **e** **antes de cada delivery** (DNS pode mudar entre os dois momentos).
- **Em dev/test**: aceita `http://` e `localhost`/`127.0.0.1` para teste local.

V1 implementa o TOCTOU 2-pass: `dns.resolve4`/`resolve6` antes de cada delivery → check de cada IP literal contra blocklist → `fetch` normal (mantém TLS SNI). Janela TOCTOU < 1s aceita V1 (RESEARCH §Pitfall 3); double validation no create + per-delivery cobre a maior parte dos vetores de ataque. **Tech debt**: para fechar a janela TOCTOU completamente, em fase futura usar `undici.Agent` com custom DNS resolver que resolve **uma única vez** e usa o mesmo IP literal no socket.

### 4. BullMQ concurrency/limiter global V1

Worker dedicado (`webhook-deliveries` queue) com `concurrency: 50` + `limiter: { max: 50, duration: 1000 }` no nível **Worker** (não per-webhook). Decisões D-32 (concurrency 5 per-webhook) e D-33 (cap 50 req/s per-webhook) ficam como "best effort V1" — ULID dedup do cliente (envelope `id`) cobre ordering, e webhooks lentos não bloqueiam outros porque concorrência é distribuída. Per-webhook real exige `@bull-board/plugin-group` ou Redis token bucket. **Tech debt**: revisitar quando volume justificar.

### 5. `createQueue + queue.add` direto (não wrapper `addJob`)

O wrapper `addJob` em `lib/queue.ts` não expõe `attempts`, `backoff`, `jobId`, `delay`, `priority` — opções que webhooks precisam (5 attempts, custom backoff, idempotency via jobId). Plan 11-02 usa `createQueue('webhook-deliveries').add(name, payload, { jobId, attempts: 5, backoff: { type: 'custom' } })` direto. **Tech debt**: estender `addJob` em fase futura para suportar essas opções de forma consistente.

### 6. Realtime via React Query polling 30s (UI-SPEC ambivalente)

Listing/log usam `refetchInterval: 30_000`. Sem mudanças em `socket-server.ts`. Tradeoff aceito V1: latência de até 30s na UI vs. complexidade de Socket.IO room dedicado para o módulo system.webhooks. **Tech debt**: Socket.IO room `tenant:{id}:system:webhooks` para subsegundos quando volume justificar.

### 7. Categoria de notificação `system.webhook.delivery_failed`

ACTIONABLE/HIGH/IN_APP+EMAIL — `digestSupported=false` (DEAD/auto-disable é evento individual de severidade alta, não agrupar). URL do botão "Ver no painel" (`/devices/webhooks/${endpointId}`) é passada via `dispatch.data.url` no dispatcher consumer. Não é declarativa no manifest porque o schema atual de `ModuleNotificationManifest.categories[]` não embed URL.

## Consequências

### Compliance

- AuditEntity estendido com 2 entries (`WEBHOOK_ENDPOINT`, `WEBHOOK_DELIVERY`).
- AuditAction estendido com 5 entries (`WEBHOOK_REGISTERED`, `WEBHOOK_DELETED`, `WEBHOOK_DELIVERY_FAILED`, `WEBHOOK_DELIVERY_REPROCESSED`, `WEBHOOK_AUTO_DISABLED`).
- Templates PII-safe em `src/constants/audit-messages/system.messages.ts` — placeholders apenas (host da URL mascarado, last4 do secret, eventId, deliveryId, reason). LGPD audit trail completo.

### Segurança

- Secret 32 bytes random + base64url + visible-once + rotação suave 7 dias (D-07/D-08).
- Anti-SSRF defesa em camadas (item 3).
- PIN gate em delete/regenerate/reactivate (PUNCH-NOTIF-\* pattern de Phase 7-03).
- Tenant-scoped estrito (D-35) — `WebhookEndpoint.tenantId NOT NULL`; consumer filtra `event.tenantId === webhook.tenantId` antes de enfileirar delivery.

### Performance

- 50 webhooks/tenant cap fixo (D-34) suficiente V1.
- Auto-disable após 10 DEAD consecutivas ou HTTP 410 Gone (D-25) protege contra clientes hostis ou endpoints abandonados.
- 90 dias de retenção para entregas DEAD (D-23) — cleanup diário via BullMQ scheduler com Redis SETNX lock multi-machine.

### Tech debt registrada

5 itens documentados explicitamente:

1. TOCTOU completamente fechada via undici.Agent custom DNS (item 3).
2. Per-webhook concurrency/limiter real (item 4).
3. Wrapper `addJob` estendido com attempts/backoff/jobId (item 5).
4. Socket.IO realtime para system.webhooks (item 6).
5. Versionamento HMAC v2/v3 quando padrões de mercado mudarem (item 2).

## Alternativas consideradas

- **`hr.webhooks.*`**: rejeitado — webhooks não são módulo de plano (D-11), eventos podem vir de sales/finance no futuro. Forçaria refactor de namespace ao adicionar V2.
- **GitHub-style header `X-Hub-Signature-256`**: rejeitado em favor de Stripe `v1=` que permite versionamento (D-04). GitHub não tem versionamento de algoritmo no header — migração futura forçaria nome de header novo (mais quebrável).
- **Lib `is-ip-private` npm**: rejeitado — supply-chain risk (transitive deps), implementação manual ~80 LOC + DNS rebinding mitigation (RESEARCH §Pattern 4). Manter zero dep extra além de `ulid`.
- **Worker concurrency=5 per-webhook real (multi-queue)**: rejeitado V1 — overhead de criar 1 BullMQ queue por webhook (50 webhooks × 50 tenants = 2500 queues no Redis; impacto memory + latência de scheduler). Revisitar se volume justificar.
- **Webhooks sem retry automático (cliente faz retry)**: rejeitado — semântica padrão de mercado (Stripe, GitHub, Shopify) é retry server-side. Cliente que queira polling no lugar de webhook usa endpoint REST tradicional.
- **`migrate dev` em vez de `db push`**: rejeitado para Plan 11-01 — schema é aditivo only; lesson Phase 4-01/6-01/7-01/9-01: db push em fases evolutivas adicionais evita drift histórico de migrations. Plan 11-02 fará migration tradicional para os artefatos de runtime.

## Notas de implementação

- ULID preferido sobre UUID para `id` do envelope (`evt_<ulid>`) — ordem temporal natural ajuda cliente fazer dedup + ordenação.
- Dot-namespacing dos eventos (`punch.time-entry.created`) consistente com nomes internos do `PUNCH_EVENTS` (Phase 4-05).
- Categoria de notificação **única** V1 (`system.webhook.delivery_failed`) cobre tanto DEAD quanto auto-disabled — payload distingue via `data.reason` ∈ {`dead`, `auto_disabled_consecutive_dead`, `auto_disabled_http_410`}.
