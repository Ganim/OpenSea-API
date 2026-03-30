import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { v1CreateBonusController } from './v1-create-bonus.controller';
import { v1DeleteBonusController } from './v1-delete-bonus.controller';
import { v1GetBonusController } from './v1-get-bonus.controller';
import { v1ListBonusesController } from './v1-list-bonuses.controller';
import { v1UpdateBonusController } from './v1-update-bonus.controller';

export async function bonusesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('HR'));

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1CreateBonusController);
      mutationApp.register(v1UpdateBonusController);
      mutationApp.register(v1DeleteBonusController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1GetBonusController);
      queryApp.register(v1ListBonusesController);
    },
    { prefix: '' },
  );
}
