import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import { checkEnterpriseCnpjController } from './v1-check-cnpj.controller';
import { createEnterpriseController } from './v1-create-enterprise.controller';
import { deleteEnterpriseController } from './v1-delete-enterprise.controller';
import { getEnterpriseByIdController } from './v1-get-enterprise-by-id.controller';
import { listEnterprisesController } from './v1-list-enterprises.controller';
import { updateEnterpriseController } from './v1-update-enterprise.controller';

export async function enterprisesRoutes(app: FastifyInstance) {
  // Manager routes with mutation rate limit
  app.register(
    async (managerApp) => {
      managerApp.register(rateLimit, rateLimitConfig.mutation);
      managerApp.register(createEnterpriseController);
      managerApp.register(updateEnterpriseController);
      managerApp.register(deleteEnterpriseController);
    },
    { prefix: '' },
  );

  // Authenticated routes with query rate limit
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(getEnterpriseByIdController);
      queryApp.register(listEnterprisesController);
      queryApp.register(checkEnterpriseCnpjController);
    },
    { prefix: '' },
  );
}
