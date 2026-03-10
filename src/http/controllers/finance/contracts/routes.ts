import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';

import { createContractController } from './v1-create-contract.controller';
import { listContractsController } from './v1-list-contracts.controller';
import { getContractByIdController } from './v1-get-contract-by-id.controller';
import { updateContractController } from './v1-update-contract.controller';
import { deleteContractController } from './v1-delete-contract.controller';
import { generateContractEntriesController } from './v1-generate-contract-entries.controller';
import { getSupplierHistoryController } from './v1-get-supplier-history.controller';

export async function contractsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('FINANCE'));

  // supplier-history must be registered BEFORE :id routes to avoid param collision
  app.register(getSupplierHistoryController);
  app.register(listContractsController);
  app.register(getContractByIdController);
  app.register(createContractController);
  app.register(updateContractController);
  app.register(deleteContractController);
  app.register(generateContractEntriesController);
}
