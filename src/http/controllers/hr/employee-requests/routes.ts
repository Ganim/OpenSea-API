import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { v1CreateMyRequestController } from './v1-create-my-request.controller';
import { v1ListMyRequestsController } from './v1-list-my-requests.controller';
import { v1GetMyRequestController } from './v1-get-my-request.controller';
import { v1CancelMyRequestController } from './v1-cancel-my-request.controller';
import { v1ListPendingApprovalsController } from './v1-list-pending-approvals.controller';
import { v1ApproveRequestController } from './v1-approve-request.controller';
import { v1RejectRequestController } from './v1-reject-request.controller';

export async function employeeRequestsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('HR'));

  // Mutation routes (create, cancel, approve, reject)
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1CreateMyRequestController);
      mutationApp.register(v1CancelMyRequestController);
      mutationApp.register(v1ApproveRequestController);
      mutationApp.register(v1RejectRequestController);
    },
    { prefix: '' },
  );

  // Query routes (list, get)
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1ListMyRequestsController);
      queryApp.register(v1GetMyRequestController);
      queryApp.register(v1ListPendingApprovalsController);
    },
    { prefix: '' },
  );
}
