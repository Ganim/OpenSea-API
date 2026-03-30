import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { v1CreateTrainingProgramController } from './v1-create-training-program.controller';
import { v1DeleteTrainingProgramController } from './v1-delete-training-program.controller';
import { v1GetTrainingProgramController } from './v1-get-training-program.controller';
import { v1ListTrainingProgramsController } from './v1-list-training-programs.controller';
import { v1UpdateTrainingProgramController } from './v1-update-training-program.controller';

export async function trainingProgramsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('HR'));

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1CreateTrainingProgramController);
      mutationApp.register(v1UpdateTrainingProgramController);
      mutationApp.register(v1DeleteTrainingProgramController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1GetTrainingProgramController);
      queryApp.register(v1ListTrainingProgramsController);
    },
    { prefix: '' },
  );
}
