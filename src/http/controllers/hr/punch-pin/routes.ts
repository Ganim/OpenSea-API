import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';

import { rateLimitConfig } from '@/config/rate-limits';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';

import { v1SetPunchPinController } from './v1-set-punch-pin.controller';
import { v1UnlockPunchPinController } from './v1-unlock-punch-pin.controller';

/**
 * Aggregator for the Phase 5 punch-pin HTTP surface (Plan 05-05).
 * Mirrors `punch-devices/routes.ts`:
 *   - addHook preHandler → createModuleMiddleware('HR')
 *   - mutation sub-app with stricter rate limit (both endpoints are admin
 *     mutations — set-pin touches the hash column; unlock-pin touches the
 *     lockout columns)
 *
 * Verify (D-10 / D-11) is intentionally NOT exposed as HTTP — it runs inside
 * Plan 05-07's `ExecutePunchUseCase` as part of the kiosk pin+matricula flow.
 */
export async function punchPinRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('HR'));

  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1SetPunchPinController);
      mutationApp.register(v1UnlockPunchPinController);
    },
    { prefix: '' },
  );
}
