import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import { v1ListTablesController } from './v1-list-tables.controller';
import { v1GetTableItemsController } from './v1-get-table-items.controller';

export async function esocialTablesRoutes(app: FastifyInstance) {
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1ListTablesController);
      queryApp.register(v1GetTableItemsController);
    },
    { prefix: '' },
  );
}
