import type { FastifyInstance } from 'fastify';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { createTicketController } from './v1-create-ticket.controller';
import { replyMyTicketController } from './v1-reply-my-ticket.controller';
import { rateTicketController } from './v1-rate-ticket.controller';
import { listMyTicketsController } from './v1-list-my-tickets.controller';
import { getMyTicketController } from './v1-get-my-ticket.controller';

export async function tenantSupportRoutes(app: FastifyInstance) {
  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.admin);
      mutationApp.register(createTicketController);
      mutationApp.register(replyMyTicketController);
      mutationApp.register(rateTicketController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(listMyTicketsController);
      queryApp.register(getMyTicketController);
    },
    { prefix: '' },
  );
}
