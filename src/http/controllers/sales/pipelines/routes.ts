import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { createPipelineController } from './v1-create-pipeline.controller';
import { deletePipelineController } from './v1-delete-pipeline.controller';
import { getPipelineByIdController } from './v1-get-pipeline-by-id.controller';
import { listPipelinesController } from './v1-list-pipelines.controller';
import { updatePipelineController } from './v1-update-pipeline.controller';

export async function pipelinesRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  // Admin routes with elevated rate limit
  app.register(
    async (adminApp) => {
      adminApp.register(rateLimit, rateLimitConfig.admin);
      adminApp.register(deletePipelineController);
    },
    { prefix: '' },
  );

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(createPipelineController);
      mutationApp.register(updatePipelineController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(getPipelineByIdController);
      queryApp.register(listPipelinesController);
    },
    { prefix: '' },
  );
}
