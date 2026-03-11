import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { v1CreatePositionController } from './v1-create-position.controller';
import { v1DeletePositionController } from './v1-delete-position.controller';
import { v1GetPositionByIdController } from './v1-get-position-by-id.controller';
import { v1ListPositionsController } from './v1-list-positions.controller';
import { v1UpdatePositionController } from './v1-update-position.controller';

export async function positionsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('HR'));

  // Manager routes with mutation rate limit
  app.register(
    async (managerApp) => {
      managerApp.register(rateLimit, rateLimitConfig.mutation);
      managerApp.register(v1CreatePositionController);
      managerApp.register(v1UpdatePositionController);
      managerApp.register(v1DeletePositionController);
    },
    { prefix: '' },
  );

  // Authenticated routes with query rate limit
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1GetPositionByIdController);
      queryApp.register(v1ListPositionsController);
    },
    { prefix: '' },
  );
}
