import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';

import { createContractController } from './v1-create-contract.controller';
import { listContractsController } from './v1-list-contracts.controller';
import { getContractByIdController } from './v1-get-contract-by-id.controller';
import { updateContractController } from './v1-update-contract.controller';
import { deleteContractController } from './v1-delete-contract.controller';
import { generateContractEntriesController } from './v1-generate-contract-entries.controller';
import { getSupplierHistoryController } from './v1-get-supplier-history.controller';

export async function contractsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('FINANCE'));

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      // supplier-history must be registered BEFORE :id routes to avoid param collision
      queryApp.register(getSupplierHistoryController);
      queryApp.register(listContractsController);
      queryApp.register(getContractByIdController);
    },
    { prefix: '' },
  );

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.financeMutation);
      mutationApp.register(createContractController);
      mutationApp.register(updateContractController);
      mutationApp.register(deleteContractController);
      mutationApp.register(generateContractEntriesController);
    },
    { prefix: '' },
  );
}
