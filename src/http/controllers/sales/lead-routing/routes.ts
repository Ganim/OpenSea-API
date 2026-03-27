import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { createRoutingRuleController } from './v1-create-routing-rule.controller';
import { updateRoutingRuleController } from './v1-update-routing-rule.controller';
import { deleteRoutingRuleController } from './v1-delete-routing-rule.controller';
import { listRoutingRulesController } from './v1-list-routing-rules.controller';
import { getRoutingRuleByIdController } from './v1-get-routing-rule-by-id.controller';
import { routeLeadController } from './v1-route-lead.controller';

export async function leadRoutingRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  // Admin routes with elevated rate limit
  app.register(
    async (adminApp) => {
      adminApp.register(rateLimit, rateLimitConfig.admin);
      adminApp.register(deleteRoutingRuleController);
    },
    { prefix: '' },
  );

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(createRoutingRuleController);
      mutationApp.register(updateRoutingRuleController);
      mutationApp.register(routeLeadController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(listRoutingRulesController);
      queryApp.register(getRoutingRuleByIdController);
    },
    { prefix: '' },
  );
}
