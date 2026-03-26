import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { createDiscountRuleController } from './v1-create-discount-rule.controller';
import { deleteDiscountRuleController } from './v1-delete-discount-rule.controller';
import { getDiscountRuleByIdController } from './v1-get-discount-rule-by-id.controller';
import { listDiscountsController } from './v1-list-discounts.controller';
import { updateDiscountRuleController } from './v1-update-discount-rule.controller';
import { validateDiscountController } from './v1-validate-discount.controller';

export async function discountsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  await app.register(listDiscountsController);
  await app.register(getDiscountRuleByIdController);
  await app.register(createDiscountRuleController);
  await app.register(updateDiscountRuleController);
  await app.register(deleteDiscountRuleController);
  await app.register(validateDiscountController);
}
