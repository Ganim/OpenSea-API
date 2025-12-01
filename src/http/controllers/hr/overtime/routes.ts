import { app } from '@/app';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { approveOvertimeController } from './v1-approve-overtime.controller';
import { getOvertimeController } from './v1-get-overtime.controller';
import { listOvertimeController } from './v1-list-overtime.controller';
import { requestOvertimeController } from './v1-request-overtime.controller';

export async function overtimeRoutes() {
  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(requestOvertimeController);
      mutationApp.register(approveOvertimeController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(getOvertimeController);
      queryApp.register(listOvertimeController);
    },
    { prefix: '' },
  );
}
