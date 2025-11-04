import type { FastifyInstance } from 'fastify';
import { createVariantPromotionController } from './v1-create-variant-promotion.controller';
import { deleteVariantPromotionController } from './v1-delete-variant-promotion.controller';
import { getVariantPromotionByIdController } from './v1-get-variant-promotion-by-id.controller';
import { listVariantPromotionsController } from './v1-list-variant-promotions.controller';
import { updateVariantPromotionController } from './v1-update-variant-promotion.controller';

export async function variantPromotionsRoutes(app: FastifyInstance) {
  await app.register(getVariantPromotionByIdController);
  await app.register(listVariantPromotionsController);
  await app.register(createVariantPromotionController);
  await app.register(updateVariantPromotionController);
  await app.register(deleteVariantPromotionController);
}
