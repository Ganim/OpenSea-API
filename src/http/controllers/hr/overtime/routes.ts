import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { v1ApproveOvertimeController } from './v1-approve-overtime.controller';
import { v1GetOvertimeController } from './v1-get-overtime.controller';
import { v1ListOvertimeController } from './v1-list-overtime.controller';
import { v1RejectOvertimeController } from './v1-reject-overtime.controller';
import { v1RequestOvertimeController } from './v1-request-overtime.controller';

export async function overtimeRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('HR'));

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1RequestOvertimeController);
      mutationApp.register(v1ApproveOvertimeController);
      mutationApp.register(v1RejectOvertimeController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1GetOvertimeController);
      queryApp.register(v1ListOvertimeController);
    },
    { prefix: '' },
  );
}
