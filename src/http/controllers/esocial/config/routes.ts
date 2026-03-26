import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import { v1GetEsocialConfigController } from './v1-get-esocial-config.controller';
import { v1UpdateEsocialConfigController } from './v1-update-esocial-config.controller';

export async function esocialConfigRoutes(app: FastifyInstance) {
  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1GetEsocialConfigController);
    },
    { prefix: '' },
  );

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1UpdateEsocialConfigController);
    },
    { prefix: '' },
  );
}
