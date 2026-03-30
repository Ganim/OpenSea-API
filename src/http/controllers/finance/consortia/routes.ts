import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';

import { createConsortiumController } from './v1-create-consortium.controller';
import { updateConsortiumController } from './v1-update-consortium.controller';
import { deleteConsortiumController } from './v1-delete-consortium.controller';
import { getConsortiumByIdController } from './v1-get-consortium-by-id.controller';
import { listConsortiaController } from './v1-list-consortia.controller';
import { registerConsortiumPaymentController } from './v1-register-consortium-payment.controller';
import { markContemplatedController } from './v1-mark-contemplated.controller';

export async function consortiaRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('FINANCE'));

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(getConsortiumByIdController);
      queryApp.register(listConsortiaController);
    },
    { prefix: '' },
  );

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.financeMutation);
      mutationApp.register(createConsortiumController);
      mutationApp.register(updateConsortiumController);
      mutationApp.register(deleteConsortiumController);
      mutationApp.register(registerConsortiumPaymentController);
      mutationApp.register(markContemplatedController);
    },
    { prefix: '' },
  );
}
