# Notifications module

An **isolated** product inside the OpenSea API. This module is the sole owner of everything notification-related: data model, dispatch logic, delivery adapters, preferences, real-time transport, observability.

## Boundaries

- Business modules (`hr`, `sales`, `stock`, `finance`, `requests`, ...) **consume** this module through the public surface:
  ```
  import {
    notificationClient,
    NotificationType,
    NotificationPriority,
  } from '@/modules/notifications/public'
  ```
- Business modules **must not** reach into internal folders (`application`, `infrastructure`, `dispatcher`, `domain`, `http`, `workers`). ESLint blocks those imports.
- This module **must not** import from business modules. If a notification needs to reference a business entity, the consumer passes the data in — notifications never queries the business database directly.

## Folder layout

```
modules/notifications/
├── public/             # PUBLIC API — the only importable surface
│   ├── types.ts        # enums (NotificationType, Channel, State, ...)
│   ├── events.ts       # DispatchNotificationInput discriminated union
│   ├── client.ts       # NotificationClient SDK facade
│   ├── manifest-loader.ts  # registry of per-module category manifests
│   └── index.ts        # barrel
├── domain/             # entities and value objects (internal)
├── application/        # use cases (internal)
├── infrastructure/     # repositories, channel adapters, redis, HTTP clients
│   ├── adapters/       # socket, email, push, sms adapters
│   └── repositories/   # prisma/in-memory repositories
├── dispatcher/         # NotificationDispatcher — single entry point to internal engine
├── http/               # Fastify controllers for user-facing endpoints
└── workers/            # BullMQ workers (delivery, callback, expiry, digest)
```

## Protocol — how modules trigger notifications

1. **Declare** a manifest file at `src/modules/<your-module>/notifications.manifest.ts`:

   ```ts
   import type { ModuleNotificationManifest } from '@/modules/notifications/public';
   import {
     NotificationKind,
     NotificationPriority,
     NotificationChannel,
   } from '@/modules/notifications/public';

   export const hrNotificationsManifest: ModuleNotificationManifest = {
     module: 'hr',
     displayName: 'Recursos Humanos',
     icon: 'Users',
     order: 30,
     categories: [
       {
         code: 'hr.vacation_request',
         name: 'Solicitações de férias',
         description: 'Quando um funcionário solicita férias',
         defaultType: NotificationType.APPROVAL,
         defaultPriority: NotificationPriority.HIGH,
         defaultChannels: [
           NotificationChannel.IN_APP,
           NotificationChannel.EMAIL,
         ],
         digestSupported: true,
       },
     ],
   };
   ```

2. **Register** the manifest in the app boot sequence (single place, `src/boot/register-notification-manifests.ts`).

3. **Dispatch** a notification via the client SDK:

   ```ts
   import {
     notificationClient,
     NotificationType,
   } from '@/modules/notifications/public';

   await notificationClient.dispatch({
     type: NotificationType.APPROVAL,
     category: 'hr.vacation_request',
     tenantId,
     recipients: { permission: 'hr.vacations.approve' },
     title: 'Solicitação de férias pendente',
     body: `${employeeName} solicitou ${days} dias.`,
     idempotencyKey: `vacation:${requestId}:approval`,
     entity: { type: 'vacation_request', id: requestId },
     callbackUrl: '/v1/hr/vacations/approval-callback',
     expiresAt: addDays(new Date(), 7),
   });
   ```

4. **Handle callback** on the consumer side: when the user chooses an action, the notifications module posts to your `callbackUrl` with `{ notificationId, action, payload, userId, tenantId }`. Your handler persists the result.

## Notification types

| Type            | UI behavior                                      | Needs `callbackUrl` |
| --------------- | ------------------------------------------------ | ------------------- |
| `INFORMATIONAL` | Title + body only                                | No                  |
| `LINK`          | Click navigates to `actionUrl` (fallback on 404) | No                  |
| `ACTIONABLE`    | 1–3 inline buttons                               | Yes                 |
| `APPROVAL`      | Approve / reject with optional reason            | Yes                 |
| `FORM`          | Inline form with typed fields                    | Yes                 |
| `PROGRESS`      | Live progress bar via socket                     | No                  |
| `SYSTEM_BANNER` | Top-of-app banner, not in bell                   | No                  |

## Status (phase 1 — foundation)

- [x] Schema + migration
- [x] Public API surface
- [x] ESLint isolation rules
- [ ] Dispatcher implementation (phase 2)
- [ ] Adapter integrations (phase 3+)
- [ ] Frontend rendering (phase 6)
