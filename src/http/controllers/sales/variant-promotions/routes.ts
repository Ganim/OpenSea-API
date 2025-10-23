import type { FastifyInstance } from 'fastify';

import { verifyJwt } from '@/http/middlewares/verify-jwt';

import { v1CreateVariantPromotionController } from './v1-create-variant-promotion.controller';
import { v1DeleteVariantPromotionController } from './v1-delete-variant-promotion.controller';
import { v1GetVariantPromotionByIdController } from './v1-get-variant-promotion-by-id.controller';
import { v1ListVariantPromotionsController } from './v1-list-variant-promotions.controller';
import { v1UpdateVariantPromotionController } from './v1-update-variant-promotion.controller';

export async function variantPromotionsRoutes(app: FastifyInstance) {
  app.post(
    '/v1/variant-promotions',
    {
      onRequest: [verifyJwt],
      schema: v1CreateVariantPromotionController.schema,
    },
    v1CreateVariantPromotionController,
  );

  app.get(
    '/v1/variant-promotions/:id',
    {
      onRequest: [verifyJwt],
      schema: v1GetVariantPromotionByIdController.schema,
    },
    v1GetVariantPromotionByIdController,
  );

  app.get(
    '/v1/variant-promotions',
    {
      onRequest: [verifyJwt],
      schema: v1ListVariantPromotionsController.schema,
    },
    v1ListVariantPromotionsController,
  );

  app.put(
    '/v1/variant-promotions/:id',
    {
      onRequest: [verifyJwt],
      schema: v1UpdateVariantPromotionController.schema,
    },
    v1UpdateVariantPromotionController,
  );

  app.delete(
    '/v1/variant-promotions/:id',
    {
      onRequest: [verifyJwt],
      schema: v1DeleteVariantPromotionController.schema,
    },
    v1DeleteVariantPromotionController,
  );
}
