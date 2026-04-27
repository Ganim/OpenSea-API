/**
 * Punch-Bio routes aggregator — Plan 10-04.
 *
 * Pattern mirrors punch-devices/routes.ts:
 *   - addHook preHandler → createModuleMiddleware('HR')
 *   - mutation sub-app with stricter rate-limit
 */
import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { rateLimitConfig } from '@/config/rate-limits';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { v1EnrollPinController } from './v1-enroll-pin.controller';

export async function punchBioRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('HR'));

  // Mutation routes (enrollment is a write operation)
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1EnrollPinController);
    },
    { prefix: '' },
  );
}
