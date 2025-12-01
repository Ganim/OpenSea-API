import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import { createPositionController } from './v1-create-position.controller';
import { deletePositionController } from './v1-delete-position.controller';
import { getPositionByIdController } from './v1-get-position-by-id.controller';
import { listPositionsController } from './v1-list-positions.controller';
import { updatePositionController } from './v1-update-position.controller';

export async function positionsRoutes(app: FastifyInstance) {
  // Manager routes with mutation rate limit
  app.register(
    async (managerApp) => {
      managerApp.register(rateLimit, rateLimitConfig.mutation);
      managerApp.register(createPositionController);
      managerApp.register(updatePositionController);
      managerApp.register(deletePositionController);
    },
    { prefix: '' },
  );

  // Authenticated routes with query rate limit
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(getPositionByIdController);
      queryApp.register(listPositionsController);
    },
    { prefix: '' },
  );
}
