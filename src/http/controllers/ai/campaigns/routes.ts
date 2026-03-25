import type { FastifyInstance } from 'fastify';

import { generateCampaignsController } from './v1-generate-campaigns.controller';
import { applyCampaignController } from './v1-apply-campaign.controller';

export async function aiCampaignsRoutes(app: FastifyInstance) {
  app.register(generateCampaignsController);
  app.register(applyCampaignController);
}
