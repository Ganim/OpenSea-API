import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { validateCouponResponseSchema, validateCouponSchema } from '@/http/schemas';
import { prisma } from '@/lib/prisma';
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

      const coupon = await prisma.coupon.findUnique({
        where: { tenantId_code: { tenantId, code } },
      });

      if (!coupon) {
        return reply.status(200).send({
          result: { valid: false, reason: 'Coupon not found' },
        });
      }

      if (!coupon.isActive) {
        return reply.status(200).send({
          result: { valid: false, reason: 'Coupon is inactive' },
        });
      }

      const now = new Date();
      if (now < coupon.validFrom || now > coupon.validUntil) {
        return reply.status(200).send({
          result: { valid: false, reason: 'Coupon is expired or not yet valid' },
        });
      }

      if (coupon.maxUsageTotal && coupon.usageCount >= coupon.maxUsageTotal) {
        return reply.status(200).send({
          result: { valid: false, reason: 'Coupon has reached maximum usage limit' },
        });
      }

      if (coupon.minOrderValue && orderValue && Number(coupon.minOrderValue) > orderValue) {
        return reply.status(200).send({
          result: { valid: false, reason: `Minimum order value is ${Number(coupon.minOrderValue)}` },
        });
      }

      // Check applicability for specific products
      if (coupon.applicableTo === 'SPECIFIC_PRODUCTS' && variantIds && variantIds.length > 0) {
        const targetSet = new Set(coupon.targetIds);
        const hasApplicable = variantIds.some((id) => targetSet.has(id));
        if (!hasApplicable) {
          return reply.status(200).send({
            result: { valid: false, reason: 'Coupon does not apply to selected products' },
          });
        }
      }

      // Calculate discount amount
      let discountAmount: number | undefined;
      if (orderValue) {
        const couponValue = Number(coupon.value);
        if (coupon.type === 'PERCENTAGE') {
          discountAmount = (orderValue * couponValue) / 100;
          if (coupon.maxDiscount) {
            discountAmount = Math.min(discountAmount, Number(coupon.maxDiscount));
          }
        } else if (coupon.type === 'FIXED_VALUE') {
          discountAmount = Math.min(couponValue, orderValue);
        }
      }

      const couponResponse = {
        ...coupon,
        value: Number(coupon.value),
        minOrderValue: coupon.minOrderValue ? Number(coupon.minOrderValue) : null,
        maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
        maxUsageTotal: coupon.maxUsageTotal ?? null,
        campaignId: coupon.campaignId ?? null,
        aiReason: coupon.aiReason ?? null,
        customerId: coupon.customerId ?? null,
      };

      return reply.status(200).send({
        result: {
          valid: true,
          coupon: couponResponse,
          discountAmount,
        },
      });
    },
  });
}
