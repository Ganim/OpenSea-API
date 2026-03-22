import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { createBidController } from './v1-create-bid.controller';
import { listBidsController } from './v1-list-bids.controller';
import { getBidByIdController } from './v1-get-bid-by-id.controller';
import { updateBidController } from './v1-update-bid.controller';
import { deleteBidController } from './v1-delete-bid.controller';
import { listBidItemsController } from './v1-list-bid-items.controller';
import { createBidDocumentController } from './v1-create-bid-document.controller';
import { listBidDocumentsController } from './v1-list-bid-documents.controller';
import { createBidContractController } from './v1-create-bid-contract.controller';
import { listBidContractsController } from './v1-list-bid-contracts.controller';
import { createBidEmpenhoController } from './v1-create-bid-empenho.controller';
import { listBidHistoryController } from './v1-list-bid-history.controller';

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
      mutationApp.register(createBidController);
      mutationApp.register(updateBidController);
      mutationApp.register(createBidDocumentController);
      mutationApp.register(createBidContractController);
      mutationApp.register(createBidEmpenhoController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(listBidsController);
      queryApp.register(getBidByIdController);
      queryApp.register(listBidItemsController);
      queryApp.register(listBidDocumentsController);
      queryApp.register(listBidContractsController);
      queryApp.register(listBidHistoryController);
    },
    { prefix: '' },
  );
}
