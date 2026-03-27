import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { batchPredictController } from './v1-batch-predict.controller';
import { getDealPredictionController } from './v1-get-deal-prediction.controller';
import { predictDealClosureController } from './v1-predict-deal-closure.controller';

export async function predictionsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  // Batch must come before :dealId to avoid route conflict
  await app.register(batchPredictController);
  await app.register(getDealPredictionController);
  await app.register(predictDealClosureController);
}
