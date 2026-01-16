import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import { generateLabelsByZoneController } from './v1-generate-labels-by-zone.controller';
import { generateLabelsController } from './v1-generate-labels.controller';
import { getLabelPreviewController } from './v1-get-label-preview.controller';

export async function labelsRoutes(app: FastifyInstance) {
  // Query routes with query rate limit
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(getLabelPreviewController);
    },
    { prefix: '' },
  );

  // Mutation routes with mutation rate limit
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(generateLabelsController);
      mutationApp.register(generateLabelsByZoneController);
    },
    { prefix: '' },
  );
}
