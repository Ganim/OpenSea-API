import type { FastifyInstance } from 'fastify';
import { getTrackingStatsController } from './v1-get-tracking-stats.controller';
import { trackingPixelController } from './v1-tracking-pixel.controller';

export async function salesTrackingRoutes(app: FastifyInstance) {
  // Public endpoint — no auth middleware
  await app.register(trackingPixelController);

  // Authenticated endpoint
  await app.register(getTrackingStatsController);
}
