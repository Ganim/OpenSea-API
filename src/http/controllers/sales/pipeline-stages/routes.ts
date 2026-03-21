import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { createPipelineStageController } from './v1-create-pipeline-stage.controller';
import { deletePipelineStageController } from './v1-delete-pipeline-stage.controller';
import { listPipelineStagesController } from './v1-list-pipeline-stages.controller';
import { reorderPipelineStagesController } from './v1-reorder-pipeline-stages.controller';
import { updatePipelineStageController } from './v1-update-pipeline-stage.controller';

export async function pipelineStagesRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  // Admin routes with elevated rate limit
  app.register(
    async (adminApp) => {
      adminApp.register(rateLimit, rateLimitConfig.admin);
      adminApp.register(deletePipelineStageController);
    },
    { prefix: '' },
  );

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(createPipelineStageController);
      mutationApp.register(updatePipelineStageController);
      mutationApp.register(reorderPipelineStagesController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(listPipelineStagesController);
    },
    { prefix: '' },
  );
}
