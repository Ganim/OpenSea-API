import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { rateLimitConfig } from '@/config/rate-limits';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { listDowntimeRecordsController } from './v1-list-downtime-records.controller';
import { createDowntimeRecordController } from './v1-create-downtime-record.controller';
import { endDowntimeRecordController } from './v1-end-downtime-record.controller';

export async function downtimeRecordsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('PRODUCTION'));

  // Query routes com rate limit de consulta
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(listDowntimeRecordsController);
    },
    { prefix: '' },
  );

  // Mutation routes com rate limit de mutação
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(createDowntimeRecordController);
      mutationApp.register(endDowntimeRecordController);
    },
    { prefix: '' },
  );
}
