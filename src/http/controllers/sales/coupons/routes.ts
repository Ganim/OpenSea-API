import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { createCouponController } from './v1-create-coupon.controller';
import { deleteCouponController } from './v1-delete-coupon.controller';
import { getCouponByIdController } from './v1-get-coupon-by-id.controller';
import { listCouponsController } from './v1-list-coupons.controller';
import { updateCouponController } from './v1-update-coupon.controller';
import { validateCouponController } from './v1-validate-coupon.controller';

export async function couponsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  // Admin routes with elevated rate limit
  app.register(
    async (adminApp) => {
      adminApp.register(rateLimit, rateLimitConfig.admin);
      adminApp.register(deleteCouponController);
    },
    { prefix: '' },
  );

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(createCouponController);
      mutationApp.register(updateCouponController);
      mutationApp.register(validateCouponController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(getCouponByIdController);
      queryApp.register(listCouponsController);
    },
    { prefix: '' },
  );
}
