import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';

import { rateLimitConfig } from '@/config/rate-limits';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';

import { v1CancelQrRotationBulkController } from './v1-cancel-qr-rotation-bulk.controller';
import { v1ListCrachasController } from './v1-list-crachas.controller';
import { v1RotateQrTokenController } from './v1-rotate-qr-token.controller';
import { v1RotateQrTokensBulkController } from './v1-rotate-qr-tokens-bulk.controller';

/**
 * Aggregator for the Phase 5 QR-token + crachás HTTP surface (Plan 05-04).
 * Mirrors the pattern of `punch-devices/routes.ts`:
 *   - addHook preHandler → createModuleMiddleware('HR')
 *   - mutation sub-app (stricter rate limit) + query sub-app
 */
export async function qrTokensRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('HR'));

  // Mutation routes — rotate + cancel (rotate-bulk returns 202 with jobId).
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1RotateQrTokenController);
      mutationApp.register(v1RotateQrTokensBulkController);
      mutationApp.register(v1CancelQrRotationBulkController);
    },
    { prefix: '' },
  );

  // Query routes — crachás listing.
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1ListCrachasController);
    },
    { prefix: '' },
  );
}
