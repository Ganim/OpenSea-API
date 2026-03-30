import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { v1CreateObjectiveController } from './v1-create-objective.controller';
import { v1ListObjectivesController } from './v1-list-objectives.controller';
import { v1GetObjectiveController } from './v1-get-objective.controller';
import { v1UpdateObjectiveController } from './v1-update-objective.controller';
import { v1DeleteObjectiveController } from './v1-delete-objective.controller';
import { v1CreateKeyResultController } from './v1-create-key-result.controller';
import { v1CheckInKeyResultController } from './v1-check-in-key-result.controller';

export async function okrsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('HR'));

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1CreateObjectiveController);
      mutationApp.register(v1UpdateObjectiveController);
      mutationApp.register(v1DeleteObjectiveController);
      mutationApp.register(v1CreateKeyResultController);
      mutationApp.register(v1CheckInKeyResultController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1ListObjectivesController);
      queryApp.register(v1GetObjectiveController);
    },
    { prefix: '' },
  );
}
