import type { FastifyInstance } from 'fastify';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { v1GetSkillTreeController } from './v1-get-skill-tree.controller';
import { v1ListSkillDefinitionsController } from './v1-list-skill-definitions.controller';
import { v1ListSkillPricingController } from './v1-list-skill-pricing.controller';
import { v1UpsertSkillPricingController } from './v1-upsert-skill-pricing.controller';

export async function adminCatalogRoutes(app: FastifyInstance) {
  // Catalog mutation routes (upsert pricing)
  app.register(
    async (adminApp) => {
      adminApp.register(rateLimit, rateLimitConfig.admin);
      adminApp.register(v1UpsertSkillPricingController);
    },
    { prefix: '' },
  );

  // Catalog query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1ListSkillDefinitionsController);
      queryApp.register(v1GetSkillTreeController);
      queryApp.register(v1ListSkillPricingController);
    },
    { prefix: '' },
  );
}
