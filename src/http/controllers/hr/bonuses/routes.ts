import { app } from '@/app';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { createBonusController } from './v1-create-bonus.controller';
import { deleteBonusController } from './v1-delete-bonus.controller';
import { getBonusController } from './v1-get-bonus.controller';
import { listBonusesController } from './v1-list-bonuses.controller';

export async function bonusesRoutes() {
  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(createBonusController);
      mutationApp.register(deleteBonusController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(getBonusController);
      queryApp.register(listBonusesController);
    },
    { prefix: '' },
  );
}
