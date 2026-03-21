import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { activateCampaignController } from './v1-activate-campaign.controller';
import { createCampaignController } from './v1-create-campaign.controller';
import { deleteCampaignController } from './v1-delete-campaign.controller';
import { getCampaignByIdController } from './v1-get-campaign-by-id.controller';
import { listCampaignsController } from './v1-list-campaigns.controller';
import { updateCampaignController } from './v1-update-campaign.controller';

export async function campaignsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  // Admin routes with elevated rate limit
  app.register(
    async (adminApp) => {
      adminApp.register(rateLimit, rateLimitConfig.admin);
      adminApp.register(deleteCampaignController);
    },
    { prefix: '' },
  );

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(createCampaignController);
      mutationApp.register(updateCampaignController);
      mutationApp.register(activateCampaignController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(getCampaignByIdController);
      queryApp.register(listCampaignsController);
    },
    { prefix: '' },
  );
}
