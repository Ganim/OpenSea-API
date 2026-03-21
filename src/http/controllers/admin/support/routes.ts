import type { FastifyInstance } from 'fastify';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { assignTicketAdminController } from './v1-assign-ticket.controller';
import { replyTicketAdminController } from './v1-reply-ticket.controller';
import { updateTicketStatusAdminController } from './v1-update-ticket-status.controller';
import { updateSlaConfigAdminController } from './v1-update-sla-config.controller';
import { getTicketAdminController } from './v1-get-ticket.controller';
import { getSupportMetricsAdminController } from './v1-get-support-metrics.controller';
import { getSlaConfigAdminController } from './v1-get-sla-config.controller';
import { listTicketsAdminController } from './v1-list-tickets.controller';

export async function adminSupportRoutes(app: FastifyInstance) {
  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.admin);
      mutationApp.register(assignTicketAdminController);
      mutationApp.register(replyTicketAdminController);
      mutationApp.register(updateTicketStatusAdminController);
      mutationApp.register(updateSlaConfigAdminController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(listTicketsAdminController);
      queryApp.register(getTicketAdminController);
      queryApp.register(getSupportMetricsAdminController);
      queryApp.register(getSlaConfigAdminController);
    },
    { prefix: '' },
  );
}
