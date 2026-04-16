import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { v1SendKudosController } from './v1-send-kudos.controller';
import { v1ListReceivedKudosController } from './v1-list-received-kudos.controller';
import { v1ListSentKudosController } from './v1-list-sent-kudos.controller';
import { v1ListKudosFeedController } from './v1-list-kudos-feed.controller';
import { v1ToggleKudosReactionController } from './v1-toggle-kudos-reaction.controller';
import { v1ListKudosReactionsController } from './v1-list-kudos-reactions.controller';
import { v1ReplyToKudosController } from './v1-reply-to-kudos.controller';
import { v1ListKudosRepliesController } from './v1-list-kudos-replies.controller';
import { v1UpdateKudosReplyController } from './v1-update-kudos-reply.controller';
import { v1DeleteKudosReplyController } from './v1-delete-kudos-reply.controller';
import { v1PinKudosController } from './v1-pin-kudos.controller';
import { v1UnpinKudosController } from './v1-unpin-kudos.controller';

export async function kudosRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('HR'));

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1SendKudosController);
      mutationApp.register(v1ToggleKudosReactionController);
      mutationApp.register(v1ReplyToKudosController);
      mutationApp.register(v1UpdateKudosReplyController);
      mutationApp.register(v1DeleteKudosReplyController);
      mutationApp.register(v1PinKudosController);
      mutationApp.register(v1UnpinKudosController);
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
      queryApp.register(v1ListKudosReactionsController);
      queryApp.register(v1ListKudosRepliesController);
    },
    { prefix: '' },
  );
}
