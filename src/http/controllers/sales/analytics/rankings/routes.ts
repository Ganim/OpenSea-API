import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { getSellerRankingController } from './v1-get-seller-ranking.controller';
import { getProductRankingController } from './v1-get-product-ranking.controller';
import { getCustomerRankingController } from './v1-get-customer-ranking.controller';

export async function analyticsRankingsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  await app.register(getSellerRankingController);
  await app.register(getProductRankingController);
  await app.register(getCustomerRankingController);
}
