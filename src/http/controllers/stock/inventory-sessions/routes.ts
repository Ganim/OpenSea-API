import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { cancelInventorySessionController } from './v1-cancel-inventory-session.controller';
import { completeInventorySessionController } from './v1-complete-inventory-session.controller';
import { createInventorySessionController } from './v1-create-inventory-session.controller';
import { getInventorySessionController } from './v1-get-inventory-session.controller';
import { listInventorySessionsController } from './v1-list-inventory-sessions.controller';
import { pauseInventorySessionController } from './v1-pause-inventory-session.controller';
import { resolveDivergenceController } from './v1-resolve-divergence.controller';
import { resumeInventorySessionController } from './v1-resume-inventory-session.controller';
import { scanInventoryItemController } from './v1-scan-inventory-item.controller';

export async function inventorySessionsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('STOCK'));

  // Query routes with query rate limit
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(listInventorySessionsController);
      queryApp.register(getInventorySessionController);
    },
    { prefix: '' },
  );

  // Mutation routes with mutation rate limit
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(createInventorySessionController);
      mutationApp.register(pauseInventorySessionController);
      mutationApp.register(resumeInventorySessionController);
      mutationApp.register(completeInventorySessionController);
      mutationApp.register(cancelInventorySessionController);
      mutationApp.register(scanInventoryItemController);
      mutationApp.register(resolveDivergenceController);
    },
    { prefix: '' },
  );
}
