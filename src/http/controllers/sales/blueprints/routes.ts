import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { createBlueprintController } from './v1-create-blueprint.controller';
import { deleteBlueprintController } from './v1-delete-blueprint.controller';
import { getBlueprintByIdController } from './v1-get-blueprint-by-id.controller';
import { listBlueprintsController } from './v1-list-blueprints.controller';
import { updateBlueprintController } from './v1-update-blueprint.controller';
import { validateStageTransitionController } from './v1-validate-stage-transition.controller';

export async function blueprintsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  // Admin routes with elevated rate limit
  app.register(
    async (adminApp) => {
      adminApp.register(rateLimit, rateLimitConfig.admin);
      adminApp.register(deleteBlueprintController);
    },
    { prefix: '' },
  );

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(createBlueprintController);
      mutationApp.register(updateBlueprintController);
      mutationApp.register(validateStageTransitionController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(getBlueprintByIdController);
      queryApp.register(listBlueprintsController);
    },
    { prefix: '' },
  );
}
