import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';

import { rateLimitConfig } from '@/config/rate-limits';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';

import { v1DownloadBulkPdfController } from './v1-download-bulk-pdf.controller';
import { v1GenerateBadgePdfController } from './v1-generate-badge-pdf.controller';
import { v1GenerateBulkBadgePdfsController } from './v1-generate-bulk-badge-pdfs.controller';

/**
 * Aggregator for the Phase 5 crachá PDF HTTP surface (Plan 05-06).
 * Mirrors the shape of `qr-tokens/routes.ts`:
 *   - addHook preHandler → createModuleMiddleware('HR')
 *   - mutation sub-app (stricter rate limit) for POST endpoints
 *   - query sub-app for the Redis-fallback local download endpoint
 */
export async function badgesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('HR'));

  // Mutation routes — POST /badge-pdf (individual) + POST /bulk-pdf
  // (enqueues job). Both mutate state (rotate QR tokens) even though the
  // immediate response is a file/202 — use the stricter mutation bucket.
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1GenerateBadgePdfController);
      mutationApp.register(v1GenerateBulkBadgePdfsController);
    },
    { prefix: '' },
  );

  // Query routes — GET /bulk-pdf/:jobId/download (Redis fallback stream).
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1DownloadBulkPdfController);
    },
    { prefix: '' },
  );
}
