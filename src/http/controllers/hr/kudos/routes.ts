import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { v1SendKudosController } from './v1-send-kudos.controller';
import { v1ListReceivedKudosController } from './v1-list-received-kudos.controller';
import { v1ListSentKudosController } from './v1-list-sent-kudos.controller';
import { v1ListKudosFeedController } from './v1-list-kudos-feed.controller';

export async function kudosRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('HR'));

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1SendKudosController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1ListReceivedKudosController);
      queryApp.register(v1ListSentKudosController);
      queryApp.register(v1ListKudosFeedController);
    },
    { prefix: '' },
  );
}
