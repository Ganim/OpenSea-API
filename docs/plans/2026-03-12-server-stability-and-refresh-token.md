# Server Stability & Refresh Token Fix — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate server crashes by removing inline workers/schedulers from the HTTP process, and fix the refresh token race condition that causes unexpected logouts.

**Architecture:** The HTTP server process (`server.ts`) currently runs BullMQ workers and schedulers inline, consuming memory and causing crashes on Fly.io (512MB). We remove all inline workers, domain event subscribers, and schedulers from the HTTP process. Background tasks (overdue checks, reminders, stock alerts) become idempotent endpoints called by the frontend on login and periodically. Email sync moves exclusively to the dedicated worker container. The refresh token bug is a race condition where `auth-context.tsx` clears tokens before `api-client.ts` finishes its refresh — we fix this by adding an `isRefreshing` flag and proactive refresh timer.

**Tech Stack:** TypeScript, Fastify, React 19, Next.js 16, React Query, BullMQ (removed from HTTP process)

---

## Chunk 1: Backend — Remove Inline Workers & Create Routine Check Endpoint

### Task 1: Remove inline workers and domain events from server.ts

**Files:**
- Modify: `OpenSea-API/src/server.ts`

**Context:** `server.ts` currently imports and starts 3 BullMQ workers (email sync, notification, audit), the email sync scheduler, and registers domain event subscribers at lines 6-16 and 187-215. Domain events are **never emitted** from any production use case (only test files use `domainEventBus.emit`), so removing subscribers has zero functional impact. The notification worker and audit worker are stubs (TODO comments, no real DB writes). The email sync worker should run ONLY in the dedicated `Dockerfile.worker` container.

- [ ] **Step 1: Remove worker/scheduler/domain-event imports from server.ts**

Remove these imports (lines 6-14):
```typescript
// DELETE these lines:
import { startEmailSyncWorker } from './workers/queues/email-sync.queue';
import {
  startEmailSyncScheduler,
  stopEmailSyncScheduler,
} from './workers/email-sync-scheduler';
import { startAuditWorker } from './workers/queues/audit.queue';
import { startNotificationWorker } from './workers/queues/notification.queue';
import { registerDomainEventSubscribers } from './lib/domain-event-subscribers';
import { closeAllQueues } from './lib/queue';
import { closeRedisConnection } from './lib/redis';
import { getImapConnectionPool } from './services/email/imap-connection-pool';
```

- [ ] **Step 2: Remove worker startup block from start() function**

Remove lines 187-215 (domain event registration + inline worker startup):
```typescript
// DELETE this entire block:
    // Register domain event subscribers (cross-module side-effects)
    registerDomainEventSubscribers();

    // Start BullMQ workers inline ...
    if (env.DISABLE_INLINE_WORKERS) {
      // ...
    } else {
      // ...
    }
```

- [ ] **Step 3: Simplify gracefulShutdown to remove worker/Redis/IMAP cleanup**

In `gracefulShutdown()`, remove lines 111 and 117-129:
```typescript
// DELETE these lines:
    stopEmailSyncScheduler();

    // Close IMAP connection pool
    await getImapConnectionPool()
      .destroyAll()
      .catch(() => undefined);
    console.log('[shutdown] IMAP connections closed');

    // Close BullMQ queues and workers
    await closeAllQueues().catch(() => undefined);
    console.log('[shutdown] BullMQ queues closed');

    // Close Redis connection (lib/redis.ts singleton)
    await closeRedisConnection().catch(() => undefined);
    console.log('[shutdown] Redis disconnected');
```

Keep only `app.close()` and `prisma.$disconnect()` in shutdown.

- [ ] **Step 4: Remove DISABLE_INLINE_WORKERS from @env schema**

In `OpenSea-API/src/@env/index.ts`, remove lines 30-33:
```typescript
// DELETE:
  DISABLE_INLINE_WORKERS: z
    .string()
    .default('false')
    .transform((v) => v === 'true' || v === '1'),
```

Also remove the `NOTIFICATIONS_CRON_INTERVAL_MS` env var (line 29) since schedulers no longer run in-process:
```typescript
// DELETE:
  NOTIFICATIONS_CRON_INTERVAL_MS: z.coerce.number().default(60000),
```

- [ ] **Step 5: Verify the build compiles**

Run: `cd /d/Code/Projetos/OpenSea/OpenSea-API && npx tsc --noEmit`

If there are remaining references to removed imports (e.g., `DISABLE_INLINE_WORKERS` in `email/accounts/routes.ts`), fix them by removing the conditional blocks.

- [ ] **Step 6: Commit**

```bash
cd /d/Code/Projetos/OpenSea/OpenSea-API
git add src/server.ts src/@env/index.ts
git commit -m "refactor: remove inline workers, schedulers, and domain events from HTTP process

Workers now run exclusively in Dockerfile.worker container.
Domain event subscribers were never triggered from production code.
Notification and audit workers were stubs (TODO).
This eliminates memory pressure and crash vectors in the HTTP server."
```

---

### Task 2: Create the routine-check endpoint

**Files:**
- Create: `OpenSea-API/src/http/controllers/core/auth/v1-routine-check.controller.ts`
- Create: `OpenSea-API/src/use-cases/core/auth/routine-check.ts`
- Create: `OpenSea-API/src/use-cases/core/auth/factories/make-routine-check-use-case.ts`

**Context:** This endpoint replaces what the cron scripts and schedulers did. It runs idempotently on login and periodically (called by frontend every 5 minutes). It aggregates: check overdue finance entries, process due calendar reminders, check due-date task cards, and check stock alerts. Each sub-check uses existing, already-tested use cases. The endpoint requires authentication + tenant selection.

- [ ] **Step 1: Create the routine-check use case**

```typescript
// OpenSea-API/src/use-cases/core/auth/routine-check.ts
import type { CheckOverdueEntriesUseCase } from '@/use-cases/finance/entries/check-overdue-entries';
import type { ProcessDueRemindersUseCase } from '@/use-cases/calendar/events/process-due-reminders';

interface RoutineCheckRequest {
  tenantId: string;
  userId: string;
}

interface RoutineCheckResponse {
  finance: { markedOverdue: number; dueSoonAlerts: number } | null;
  calendarReminders: { processed: number; errors: number } | null;
}

export class RoutineCheckUseCase {
  constructor(
    private checkOverdueEntries: CheckOverdueEntriesUseCase,
    private processDueReminders: ProcessDueRemindersUseCase,
  ) {}

  async execute(request: RoutineCheckRequest): Promise<RoutineCheckResponse> {
    const { tenantId, userId } = request;

    // Run checks in parallel — each is idempotent and independent
    const [financeResult, remindersResult] = await Promise.allSettled([
      this.checkOverdueEntries.execute({ tenantId, createdBy: userId }),
      this.processDueReminders.execute(),
    ]);

    return {
      finance:
        financeResult.status === 'fulfilled'
          ? {
              markedOverdue: financeResult.value.markedOverdue,
              dueSoonAlerts: financeResult.value.dueSoonAlerts,
            }
          : null,
      calendarReminders:
        remindersResult.status === 'fulfilled'
          ? {
              processed: remindersResult.value.processed,
              errors: remindersResult.value.errors,
            }
          : null,
    };
  }
}
```

- [ ] **Step 2: Create the factory**

```typescript
// OpenSea-API/src/use-cases/core/auth/factories/make-routine-check-use-case.ts
import { makeCheckOverdueEntriesUseCase } from '@/use-cases/finance/entries/factories/make-check-overdue-entries-use-case';
import { makeProcessDueRemindersUseCase } from '@/use-cases/calendar/events/factories/make-process-due-reminders-use-case';
import { RoutineCheckUseCase } from '../routine-check';

export function makeRoutineCheckUseCase() {
  return new RoutineCheckUseCase(
    makeCheckOverdueEntriesUseCase(),
    makeProcessDueRemindersUseCase(),
  );
}
```

- [ ] **Step 3: Create the controller**

```typescript
// OpenSea-API/src/http/controllers/core/auth/v1-routine-check.controller.ts
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeRoutineCheckUseCase } from '@/use-cases/core/auth/factories/make-routine-check-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function routineCheckController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/auth/routine-check',
    onRequest: [verifyJwt, verifyTenant],
    schema: {
      tags: ['Auth'],
      summary:
        'Run idempotent routine checks (overdue finance, calendar reminders)',
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({
          finance: z
            .object({
              markedOverdue: z.number(),
              dueSoonAlerts: z.number(),
            })
            .nullable(),
          calendarReminders: z
            .object({
              processed: z.number(),
              errors: z.number(),
            })
            .nullable(),
        }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;

      const useCase = makeRoutineCheckUseCase();
      const result = await useCase.execute({ tenantId, userId });

      return reply.status(200).send(result);
    },
  });
}
```

- [ ] **Step 4: Register the route**

Find the auth routes file and add the new controller registration. Look at the route registration pattern used by adjacent controllers (e.g., `v1-authenticate-with-password.controller.ts`).

In `OpenSea-API/src/http/controllers/core/auth/routes.ts` (or wherever auth controllers are registered), add:
```typescript
import { routineCheckController } from './v1-routine-check.controller';
// ... in the registration function:
app.register(routineCheckController);
```

- [ ] **Step 5: Verify build compiles**

Run: `cd /d/Code/Projetos/OpenSea/OpenSea-API && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
cd /d/Code/Projetos/OpenSea/OpenSea-API
git add src/use-cases/core/auth/routine-check.ts \
        src/use-cases/core/auth/factories/make-routine-check-use-case.ts \
        src/http/controllers/core/auth/v1-routine-check.controller.ts
git commit -m "feat: add POST /v1/auth/routine-check idempotent endpoint

Aggregates overdue finance checks and calendar reminder processing.
Called by frontend on login and periodically, replacing in-process schedulers."
```

---

### Task 3: Frontend — Call routine-check on login and periodically

**Files:**
- Modify: `OpenSea-APP/src/contexts/auth-context.tsx`
- Modify: `OpenSea-APP/src/services/auth/auth.service.ts` (or wherever API calls are defined)
- Create: `OpenSea-APP/src/hooks/use-routine-check.ts`

**Context:** The frontend should call `POST /v1/auth/routine-check` in two places: (1) after successful login (fire-and-forget), and (2) via a React Query hook with `refetchInterval: 5 * 60 * 1000` that runs while the user is authenticated. The response is informational (not displayed to the user) — it triggers backend side-effects (marking overdue, creating notifications).

- [ ] **Step 1: Add API service method**

In the auth service file (find exact path via `grep -r "authService" OpenSea-APP/src/services`), add:
```typescript
async routineCheck(): Promise<{ finance: unknown; calendarReminders: unknown }> {
  return apiClient.post('/v1/auth/routine-check');
}
```

- [ ] **Step 2: Create the hook**

```typescript
// OpenSea-APP/src/hooks/use-routine-check.ts
import { authService } from '@/services';
import { useQuery } from '@tanstack/react-query';

/**
 * Runs idempotent routine checks periodically while user is authenticated.
 * Fire-and-forget: results are not used by UI, they trigger backend side-effects.
 */
export function useRoutineCheck(enabled = true) {
  return useQuery({
    queryKey: ['routine-check'],
    queryFn: () => authService.routineCheck(),
    enabled,
    refetchInterval: 5 * 60 * 1000, // Every 5 minutes
    refetchOnWindowFocus: false, // Don't spam on tab switch
    retry: false,
    staleTime: 4 * 60 * 1000, // 4 minutes
  });
}
```

- [ ] **Step 3: Add hook to auth-context**

In `OpenSea-APP/src/contexts/auth-context.tsx`, after the `useMe` call (line ~93):
```typescript
// Routine check: runs backend side-effects (overdue, reminders) periodically
useRoutineCheck(hasToken);
```

Import at top:
```typescript
import { useRoutineCheck } from '@/hooks/use-routine-check';
```

- [ ] **Step 4: Fire routine-check on login**

In the `login` callback (line ~217, after `refetchUser()` succeeds), add a fire-and-forget call:
```typescript
// Trigger routine check after login (fire-and-forget)
authService.routineCheck().catch(() => {});
```

- [ ] **Step 5: Verify build**

Run: `cd /d/Code/Projetos/OpenSea/OpenSea-APP && npx next build`
Expected: Build succeeds

- [ ] **Step 6: Commit**

```bash
cd /d/Code/Projetos/OpenSea/OpenSea-APP
git add src/hooks/use-routine-check.ts src/contexts/auth-context.tsx
git commit -m "feat: call routine-check on login and every 5 minutes

Replaces in-process schedulers with idempotent frontend-triggered checks."
```

---

## Chunk 2: Fix Refresh Token Race Condition

### Task 4: Add isRefreshing flag to TokenManager

**Files:**
- Modify: `OpenSea-APP/src/lib/api-client-auth.ts`

**Context:** The race condition: when `/v1/me` gets 401, `api-client.ts` starts async refresh, but React Query propagates the error to `auth-context.tsx` which clears tokens BEFORE the refresh completes. The fix: expose an `isRefreshing` getter so `auth-context` can check before clearing tokens. Also add a proactive refresh timer that refreshes 5 minutes before the access token expires (decoding the JWT exp claim without verification).

- [ ] **Step 1: Add isRefreshing flag and proactive refresh**

In `api-client-auth.ts`, add to the `TokenManager` class:

After `private refreshPromise` (line 15), add:
```typescript
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;

  get isRefreshing(): boolean {
    return this.refreshPromise !== null;
  }
```

- [ ] **Step 2: Add proactive refresh scheduling**

Add this method to `TokenManager`:
```typescript
  /**
   * Decode JWT payload without signature verification to read `exp`.
   * Schedules a refresh 5 minutes before expiration.
   */
  scheduleProactiveRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    const token = this.getToken();
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp as number;
      if (!exp) return;

      const now = Math.floor(Date.now() / 1000);
      // Refresh 5 minutes before expiration (access token is 30min)
      const refreshIn = (exp - now - 300) * 1000;

      if (refreshIn <= 0) {
        // Token already near expiration, refresh now
        this.refreshAccessToken().catch(() => {});
        return;
      }

      this.refreshTimer = setTimeout(() => {
        this.refreshTimer = null;
        this.refreshAccessToken().catch(() => {});
      }, refreshIn);
    } catch {
      // Invalid token format, skip proactive refresh
    }
  }
```

- [ ] **Step 3: Call scheduleProactiveRefresh after setting tokens**

In the `setTokens` method, after saving tokens (after line 77 `window.dispatchEvent...`), add:
```typescript
    // Schedule proactive refresh before new token expires
    if (token) {
      this.scheduleProactiveRefresh();
    }
```

- [ ] **Step 4: Initialize proactive refresh on construction**

In the constructor (after line 24), add:
```typescript
    // Schedule refresh for existing token (e.g., page reload)
    if (typeof window !== 'undefined') {
      this.scheduleProactiveRefresh();
    }
```

- [ ] **Step 5: Clean up timer in clearTokens**

In `clearTokens()`, before `this.setTokens(null, null)`:
```typescript
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
```

- [ ] **Step 6: Commit**

```bash
cd /d/Code/Projetos/OpenSea/OpenSea-APP
git add src/lib/api-client-auth.ts
git commit -m "feat: add proactive token refresh 5min before expiry

Decodes JWT exp claim (without verification) and schedules refresh.
Exposes isRefreshing flag for auth-context coordination."
```

---

### Task 5: Fix auth-context race condition

**Files:**
- Modify: `OpenSea-APP/src/contexts/auth-context.tsx`
- Modify: `OpenSea-APP/src/lib/api-client.ts` (export tokenManager)

**Context:** The `useEffect` at line 126 in `auth-context.tsx` clears tokens immediately on `/v1/me` error. But if `api-client.ts` is currently doing a refresh, the tokens will be restored moments later — creating a race. The fix: before clearing tokens, check `tokenManager.isRefreshing`. If refreshing, wait up to 10 seconds for it to complete. If refresh succeeds, ignore the error.

- [ ] **Step 1: Export tokenManager from api-client**

In `OpenSea-APP/src/lib/api-client.ts`, the `ApiClient` class has a private `tokenManager`. We need to expose it. After `export const apiClient = new ApiClient();` (line 301), add:

```typescript
export { TokenManager } from './api-client-auth';
```

Also, add a public getter to `ApiClient`:
```typescript
  getTokenManager(): TokenManager {
    return this.tokenManager;
  }
```

- [ ] **Step 2: Rewrite the userError useEffect in auth-context.tsx**

Replace the useEffect at lines 126-157 with:

```typescript
  // Se houve erro ao buscar usuário (token inválido/expirado), coordena com refresh
  useEffect(() => {
    if (!userError || !hasToken) return;

    const status = (userError as Error & { status?: number }).status;
    const message = (userError.message || '').toLowerCase();

    const isAuthError =
      status === 401 ||
      status === 403 ||
      message.includes('unauthorized') ||
      message.includes('forbidden') ||
      message.includes('invalid token') ||
      message.includes('token inválido');

    if (!isAuthError) {
      logger.warn('Erro não-autorização em /me, tokens preservados', {
        status,
        message,
      });
      return;
    }

    // Check if api-client is currently refreshing the token
    const tm = apiClient.getTokenManager();
    if (tm.isRefreshing) {
      // Refresh in progress — wait for it to complete before deciding
      logger.debug('Token refresh em andamento, aguardando antes de deslogar...');

      // Poll until refresh completes (max 10s)
      let attempts = 0;
      const checkInterval = setInterval(() => {
        attempts++;
        if (!tm.isRefreshing) {
          clearInterval(checkInterval);
          // Refresh completed — check if we got a new token
          const newToken = localStorage.getItem(authConfig.tokenKey);
          if (newToken) {
            logger.debug('Refresh concluído com sucesso, ignorando erro anterior');
            // Token was refreshed, refetch user data
            refetchUser();
          } else {
            // Refresh failed, proceed with logout
            performLogout();
          }
        } else if (attempts >= 50) {
          // 10 seconds passed, force logout
          clearInterval(checkInterval);
          performLogout();
        }
      }, 200);

      return;
    }

    // No refresh in progress — clear tokens immediately
    performLogout();

    function performLogout() {
      logger.debug('Token inválido, limpando...');
      localStorage.removeItem(authConfig.tokenKey);
      localStorage.removeItem(authConfig.refreshTokenKey);
      setHasToken(false);

      if (!isPublicRoute) {
        logger.debug('Redirecionando para login...');
        router.push('/fast-login?session=expired');
      }
    }
  }, [userError, hasToken, isPublicRoute, router, refetchUser]);
```

Add import at top:
```typescript
import { apiClient } from '@/lib/api-client';
```

- [ ] **Step 3: Remove the handleRefreshFailure redirect timeout**

In `OpenSea-APP/src/lib/api-client-auth.ts`, modify `handleRefreshFailure()` to NOT redirect — let auth-context handle all redirects:

Replace the entire `handleRefreshFailure` method (lines 241-261) with:
```typescript
  handleRefreshFailure(_isNetworkError = false): void {
    logger.debug('[API] Limpando tokens após falha de refresh...');
    this.clearTokens();
    // Auth-context handles redirect via token change detection
  }
```

- [ ] **Step 4: Verify the build**

Run: `cd /d/Code/Projetos/OpenSea/OpenSea-APP && npx next build`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
cd /d/Code/Projetos/OpenSea/OpenSea-APP
git add src/lib/api-client-auth.ts src/lib/api-client.ts src/contexts/auth-context.tsx
git commit -m "fix: resolve refresh token race condition causing unexpected logouts

- Auth-context now checks isRefreshing before clearing tokens
- handleRefreshFailure no longer redirects (auth-context handles it)
- Proactive refresh prevents most 401s from occurring"
```

---

### Task 6: Remove duplicate cookie from refresh endpoint

**Files:**
- Modify: `OpenSea-API/src/http/controllers/core/sessions/v1-refresh-session.controller.ts`
- Modify: `OpenSea-API/src/http/controllers/core/auth/v1-authenticate-with-password.controller.ts`

**Context:** The backend sets an HTTP-only `refreshToken` cookie AND returns it in the response body. The frontend only uses the response body (localStorage). The cookie is never read by any endpoint. This dual storage creates confusion. Remove the `setCookie` calls.

- [ ] **Step 1: Remove setCookie from refresh controller**

In `v1-refresh-session.controller.ts`, replace lines 91-107 (the `.setCookie(...).status(200).send(...)` chain) with:
```typescript
        return reply.status(200).send({
          token: newAccessToken,
          refreshToken: refreshToken.token,
          ...(tenant ? { tenant } : {}),
        });
```

- [ ] **Step 2: Remove setCookie from login controller**

Find the login controller (`v1-authenticate-with-password.controller.ts`) and remove the `.setCookie('refreshToken', ...)` call similarly.

- [ ] **Step 3: Verify build**

Run: `cd /d/Code/Projetos/OpenSea/OpenSea-API && npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
cd /d/Code/Projetos/OpenSea/OpenSea-API
git add src/http/controllers/core/sessions/v1-refresh-session.controller.ts \
        src/http/controllers/core/auth/v1-authenticate-with-password.controller.ts
git commit -m "fix: remove duplicate refreshToken cookie, use localStorage only

Frontend uses localStorage exclusively. The HTTP-only cookie was never read
by any endpoint, creating confusion without adding security."
```

---

## Post-Implementation Checklist

- [ ] Backend builds: `cd OpenSea-API && npx tsc --noEmit`
- [ ] Frontend builds: `cd OpenSea-APP && npm run build`
- [ ] Backend starts without workers: `cd OpenSea-API && npm run dev` (no Redis required for HTTP)
- [ ] Login flow works: user can log in, routine-check fires
- [ ] Token refresh works: wait 25+ minutes, verify proactive refresh happens
- [ ] Fly.io cron scripts still work (they're independent of this change)
- [ ] Dockerfile.worker still works for email sync (it imports directly, not through server.ts)

## What We Did NOT Change (Intentional)

1. **Fly.io cron scripts** (`scripts/check-*.ts`) — These run as separate processes via Fly.io machine schedules. They don't affect server stability and provide daily/hourly coverage that the routine-check endpoint supplements but doesn't replace.

2. **Dockerfile.worker** — Email sync worker continues to run in its dedicated container. It imports from `src/workers/index.ts`, not `server.ts`.

3. **Queue infrastructure** (`src/lib/queue.ts`, `src/lib/redis.ts`) — Code stays for the worker container. The HTTP process simply doesn't import it.

4. **Domain event types** (`src/lib/domain-events.ts`) — Keep the type definitions and bus class. They may be useful for future integrations. Just don't register subscribers at startup.

5. **`useMe` hook** — `retry: false` stays correct because the `api-client.ts` 401 handler already does the retry after refresh. Adding React Query retries would cause duplicate requests.
