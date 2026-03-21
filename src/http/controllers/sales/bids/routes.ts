import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';

// Bid CRUD
import { createBidController } from './v1-create-bid.controller';
import { listBidsController } from './v1-list-bids.controller';
import { getBidByIdController } from './v1-get-bid-by-id.controller';
import { updateBidController } from './v1-update-bid.controller';
import { deleteBidController } from './v1-delete-bid.controller';
import { changeBidStatusController } from './v1-change-bid-status.controller';

// Documents
import { uploadBidDocumentController } from './documents/v1-upload-document.controller';
import { listBidDocumentsController } from './documents/v1-list-documents.controller';

// Contracts
import { createBidContractController } from './contracts/v1-create-contract.controller';
import { listBidContractsController } from './contracts/v1-list-contracts.controller';
import { getBidContractByIdController } from './contracts/v1-get-contract-by-id.controller';

// Empenhos
import { createBidEmpenhoController } from './empenhos/v1-create-empenho.controller';
import { listBidEmpenhosController } from './empenhos/v1-list-empenhos.controller';

// AI Config
import { getBidAiConfigController } from './ai-config/v1-get-ai-config.controller';
import { updateBidAiConfigController } from './ai-config/v1-update-ai-config.controller';

export async function bidsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  // Admin routes with elevated rate limit
  app.register(
    async (adminApp) => {
      adminApp.register(rateLimit, rateLimitConfig.admin);
      adminApp.register(deleteBidController);
    },
    { prefix: '' },
  );

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      // Bids
      mutationApp.register(createBidController);
      mutationApp.register(updateBidController);
      mutationApp.register(changeBidStatusController);
      // Documents
      mutationApp.register(uploadBidDocumentController);
      // Contracts
      mutationApp.register(createBidContractController);
      // Empenhos
      mutationApp.register(createBidEmpenhoController);
      // AI Config
      mutationApp.register(updateBidAiConfigController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      // Bids
      queryApp.register(getBidByIdController);
      queryApp.register(listBidsController);
      // Documents
      queryApp.register(listBidDocumentsController);
      // Contracts
      queryApp.register(getBidContractByIdController);
      queryApp.register(listBidContractsController);
      // Empenhos
      queryApp.register(listBidEmpenhosController);
      // AI Config
      queryApp.register(getBidAiConfigController);
    },
    { prefix: '' },
  );
}
