# Notifications Module

Sistema de notificações multi-canal com preferências por usuário, DND, módulo RBAC granular e protocolo formal de dispatch/callback.

> Atualizado no Sprint 3 (2026-04-18) após remediação de auditoria QA.

## Arquitetura

```
┌──────────────────────────────────────────────────────────────┐
│ Módulos produtores (finance, hr, stock, tasks, requests, ai) │
│   via `notificationClient.dispatch(input)` ou helpers         │
│   (ModuleNotifier<Category>, RequestNotifier)                │
└─────────────────┬────────────────────────────────────────────┘
                  │
┌─────────────────▼────────────────────────────────────────────┐
│ NotificationDispatcher (src/modules/notifications/dispatcher)│
│   1. Manifest guard (isCategoryDeclared + STRICT flag)        │
│   2. Resolve recipients (RecipientResolver)                   │
│   3. Preference hierarchy (DND > master > module > category)  │
│   4. Idempotência (idempotencyKey) + grouping (groupKey)      │
│   5. Persist + emit Socket.IO "notification.created"          │
│   6. Fan-out a channel adapters (in-app, email, push, sms)    │
│   7. Métricas Prometheus (dispatch_latency, dispatched_total) │
└─────────────────┬────────────────────────────────────────────┘
                  │
┌─────────────────▼────────────────────────────────────────────┐
│ Canais / Delivery                                             │
│   • IN_APP  (Socket.IO event bus)                             │
│   • EMAIL   (Resend/Mailgun adapter)                          │
│   • PUSH    (Web Push / VAPID)                                │
│   • SMS     (provider agnostic adapter)                       │
│   • WHATSAPP (opt-in tenant flag)                             │
└──────────────────────────────────────────────────────────────┘
```

## Protocolo formal

### DispatchNotificationInput

```ts
{
  tenantId: string
  category: string                       // declared in manifest
  recipients: RecipientSelector          // { userIds, groupIds, roleCodes, ... }
  type: NotificationType
  title: string
  body: string
  priority?: NotificationPriority        // default NORMAL
  channels?: NotificationChannel[]       // override category default
  idempotencyKey: string
  groupKey?: string                      // merges into existing unread
  actionUrl?, fallbackUrl?, metadata?, entity?, expiresAt?
  // Kind-specific: initialProgress, totalSteps, actions, fields,
  //                reportUrl, imageUrl, emailSubject, ...
}
```

Returns `{ notificationIds, recipientCount, deduplicated, suppressedByPreference }`.

### Resolve (ACTIONABLE / APPROVAL / FORM)

```
POST /v1/notifications/:id/resolve
body: { actionKey, payload?, reason? }
```

- Idempotente: chamar `resolve` com a mesma `actionKey` não falha.
- ConflictError se o estado já foi resolvido com outra `actionKey`.
- GoneError se `expiresAt` já passou.
- Propaga o resultado para `callbackUrl` (se configurada) via BullMQ queue `notification-callbacks` com retry exponencial (1s → 30min, max 5).

## Módulos (manifest)

Cada módulo produtor declara suas categorias:

```ts
// src/modules/notifications/manifests/punch.manifest.ts
registerManifestInMemory({
  code: 'punch',
  displayName: 'Ponto',
  icon: 'Clock',
  order: 35,
  categories: [
    { code: 'punch.registered',          defaultKind: 'INFORMATIONAL', ... },
    { code: 'punch.approval_requested',  defaultKind: 'APPROVAL', ... },
    { code: 'punch.late',                defaultKind: 'INFORMATIONAL', ... },
  ],
})
```

Com `NOTIFICATIONS_STRICT_MANIFEST=true`, categorias não declaradas lançam 400 `UndeclaredCategoryError`.

## Endpoints

### V2 (atual — `src/modules/notifications/http/routes.ts`)

| Método | Endpoint                                   | RBAC                                     |
| ------ | ------------------------------------------ | ---------------------------------------- |
| GET    | `/v1/notifications/me`                     | `tools.notifications.access`             |
| POST   | `/v1/notifications/:id/resolve`            | `tools.notifications.access`             |
| POST   | `/v1/notifications/:id/progress`           | (internal producers)                     |
| GET    | `/v1/notifications/modules-manifest`       | `tools.notifications.preferences.access` |
| GET    | `/v1/notifications/settings`               | `tools.notifications.preferences.access` |
| PUT    | `/v1/notifications/settings`               | `tools.notifications.preferences.modify` |
| GET    | `/v1/notifications/preferences`            | `tools.notifications.preferences.access` |
| PUT    | `/v1/notifications/preferences`            | `tools.notifications.preferences.modify` |
| GET    | `/v1/notifications/push-subscriptions`     | `tools.notifications.devices.admin`      |
| POST   | `/v1/notifications/push-subscriptions`     | `tools.notifications.devices.admin`      |
| DELETE | `/v1/notifications/push-subscriptions/:id` | `tools.notifications.devices.admin`      |
| POST   | `/v1/notifications/test-send`              | `tools.notifications.access`             |

### V1 legacy (deprecated com Sunset: 2026-07-17)

- `GET /v1/me/notification-preferences`
- `POST /v1/me/notification-preferences`
- `PUT /v1/me/notification-preferences/:id`
- `DELETE /v1/me/notification-preferences/:id`

Backfill disponível: `npm run notifications:backfill-v2[:dry]`.

## Permissões (Sprint 3 S3.4)

| Código                                   | Uso                                   |
| ---------------------------------------- | ------------------------------------- |
| `tools.notifications.access`             | Listar, resolver, testar              |
| `tools.notifications.preferences.access` | Ver manifest + settings + preferences |
| `tools.notifications.preferences.modify` | Atualizar settings + preferences      |
| `tools.notifications.devices.admin`      | Gerenciar push subscriptions          |

Backfill: `npm run notifications:backfill-rbac` (idempotente).

## Observabilidade (Sprint 3 S3.5)

### Métricas (Prometheus)

- `notifications_dispatched_total{channel, category, result}` — `result` ∈ `created | suppressed`
- `notifications_dispatch_latency_ms{category, result}` — histogram em ms (buckets 5…5000)
- `notifications_resolved_total_v2{category, action_key, state}`
- `notifications_created_total{category, kind, priority, tenant}` (legacy)
- `notifications_delivered_total{channel, status}` (legacy)

### Audit Log

Gravado em `audit_logs`:

- `NOTIFICATION_SEND` — producer dispatch
- `NOTIFICATION_READ` — mark-as-read + mark-all-read
- `NOTIFICATION_DELETE` — dismiss
- `UPDATE / NOTIFICATION_PREFERENCE` — settings + preferences PUT
- `UPDATE / NOTIFICATION` — resolve actionable/approval

## Workers

| Queue                        | Worker                  | Script                                  |
| ---------------------------- | ----------------------- | --------------------------------------- |
| `notifications-scheduler`    | scheduled notifications | `npm run notifications:worker`          |
| `notification-callbacks`     | callback HTTP posts     | `npm run notifications:callback-worker` |
| `notification-bulk-dispatch` | bulk fan-out assíncrono | `npm run notifications:bulk-worker`     |

Callbacks usam retry exponencial: 1s → 5s → 30s → 5min → 30min (max 5 attempts).

## Frontend

Consumidores principais:

- `NotificationsBell` (`src/features/notifications/components/notifications-bell.tsx`) — dropdown no navbar
- `NotificationsPage` (`/notifications`) — lista completa com infinite scroll (IntersectionObserver)
- `NotificationsTab` (`/profile?tab=notifications`) — preferências granulares
- `NotificationItem` — render por kind, com sanitização XSS (dompurify)

### Hooks

- `useNotificationsListV2(filters)` — lista paginada (single page)
- `useNotificationsInfiniteV2(filters)` — infinite scroll (cursor)
- `useNotificationSettings()` / `useUpdateNotificationSettings()`
- `useNotificationPreferencesBundle()` / `useUpdateNotificationPreferences()`
- `usePushDevices()` / `useRevokePushDevice()` / `usePushSubscription()`
- `useResolveNotification()` / `useSendTestNotification()`

## Segurança

- Title/message/action labels/URLs sanitizados com `dompurify` (defense in depth — React já escapa, mas `dompurify` cobre tipos que passam por HTML downstream)
- Apenas URLs com protocolos `https?://`, `mailto:`, `tel:` ou caminhos relativos são permitidas em `actionUrl/metadata.imageUrl` (evita `javascript:`)
- IDOR: `NotificationsRepository.markAsRead/delete` exigem `userId` como filtro — testes cross-user em `*.e2e.spec.ts`
- RBAC: todas as rotas v2 exigem permissão granular (acima)

## Variáveis de ambiente

- `NOTIFICATIONS_STRICT_MANIFEST=false|true` — modo estrito de manifest (Sprint 2)
- `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` — para Web Push

## Referências

- ADRs: ver `docs/adr/` (nenhum ADR dedicado ainda — criar na Phase 8 se arquitetura mudar)
- Sprint 3 status: `memory/project_notifications_refactor_status.md` (transiente, a remover após merge)
- Protocolo: este arquivo + `src/modules/notifications/public/events.ts`
