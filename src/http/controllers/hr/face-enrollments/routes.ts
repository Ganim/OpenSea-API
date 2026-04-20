import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';

import { rateLimitConfig } from '@/config/rate-limits';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';

import { v1CreateFaceEnrollmentsController } from './v1-create-face-enrollments.controller';
import { v1ListFaceEnrollmentsController } from './v1-list-face-enrollments.controller';
import { v1RemoveFaceEnrollmentsController } from './v1-remove-face-enrollments.controller';

/**
 * Aggregator das rotas de enrollment facial (Phase 5 / Plan 05-03).
 * Espelha o pattern de `punch-devices/routes.ts`:
 *   - addHook preHandler → createModuleMiddleware('HR')
 *   - sub-apps separados para mutation (rate-limit mais estrito) e query
 */
export async function faceEnrollmentsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('HR'));

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1CreateFaceEnrollmentsController);
      mutationApp.register(v1RemoveFaceEnrollmentsController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1ListFaceEnrollmentsController);
    },
    { prefix: '' },
  );
}
