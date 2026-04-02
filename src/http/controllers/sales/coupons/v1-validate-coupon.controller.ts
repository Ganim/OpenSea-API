import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  validateCouponResponseSchema,
  validateCouponSchema,
} from '@/http/schemas';
import { makeValidateCouponUseCase } from '@/use-cases/sales/coupons/factories/make-validate-coupon-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function validateCouponController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/coupons/validate',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.COUPONS.ACCESS,
        resource: 'coupons',
      }),
    ],
    schema: {
      tags: ['Sales - Coupons'],
      summary: 'Validate a coupon code',
      body: validateCouponSchema,
      response: {
        200: z.object({
          result: validateCouponResponseSchema,
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { code, orderValue, variantIds } = request.body;

      try {
        const useCase = makeValidateCouponUseCase();
        const { coupon, discountType, discountValue } = await useCase.execute({
          tenantId,
          code,
          orderValue,
          productIds: variantIds,
        });

        // Calculate discount amount
        let discountAmount: number | undefined;
        if (orderValue) {
          if (discountType === 'PERCENTAGE') {
            discountAmount = (orderValue * discountValue) / 100;
            if (coupon.maxDiscountAmount) {
              discountAmount = Math.min(
                discountAmount,
                coupon.maxDiscountAmount,
              );
            }
          } else if (
            discountType === 'FIXED_AMOUNT' ||
            discountType === 'FREE_SHIPPING'
          ) {
            discountAmount = Math.min(discountValue, orderValue);
          }
        }

        return reply.status(200).send({
          result: {
            valid: true,
            coupon: {
              id: coupon.couponId.toString(),
              tenantId: coupon.tenantId.toString(),
              code: coupon.code,
              type: coupon.discountType,
              value: coupon.discountValue,
              applicableTo: coupon.applicableTo,
              minOrderValue: coupon.minOrderValue ?? null,
              maxDiscount: coupon.maxDiscountAmount ?? null,
              maxUsageTotal: coupon.maxUsageTotal ?? null,
              maxUsagePerCustomer: coupon.maxUsagePerCustomer ?? 0,
              usageCount: coupon.currentUsageTotal,
              validFrom: coupon.startDate ?? new Date(),
              validUntil: coupon.endDate ?? new Date(),
              isActive: coupon.isActive,
              campaignId: null,
              aiGenerated: false,
              aiReason: null,
              customerId: null,
              targetIds: [],
              createdAt: coupon.createdAt,
              updatedAt: coupon.updatedAt,
            },
            discountAmount,
          },
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(200).send({
            result: { valid: false, reason: 'Coupon not found' },
          });
        }
        if (error instanceof BadRequestError) {
          return reply.status(200).send({
            result: { valid: false, reason: error.message },
          });
        }
        throw error;
      }
    },
  });
}
