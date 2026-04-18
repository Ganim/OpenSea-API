import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';

import { rateLimitConfig } from '@/config/rate-limits';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';

import { v1ExecutePunchController } from './v1-execute-punch.controller';

/**
 * Aggregator for the unified punch endpoint (Plan 04-04 / D-03).
 *
 * Mirrors the structure of `time-control/routes.ts` and
 * `punch-devices/routes.ts`:
 * - `addHook('preHandler', createModuleMiddleware('HR'))` — enforces
 *   that the caller's plan includes the HR module. This applies to
 *   both auth paths (JWT and device-token) because the tenant row is
 *   the same enforcement point.
 * - `mutation` sub-app uses the strict mutation rate-limit bucket to
 *   protect the punch DB from abusive clients.
 */
export async function punchRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('HR'));

  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1ExecutePunchController);
    },
    { prefix: '' },
  );
}
