import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { couponResponseSchema, createCouponSchema } from '@/http/schemas';
import { prisma } from '@/lib/prisma';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createCouponController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/coupons',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.COUPONS.REGISTER,
        resource: 'coupons',
      }),
    ],
    schema: {
      tags: ['Sales - Coupons'],
      summary: 'Create a new coupon',
      body: createCouponSchema,
      response: {
        201: z.object({
          coupon: couponResponseSchema,
        }),
        400: z.object({ message: z.string() }),
        409: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const body = request.body;

      // Check for duplicate code in tenant
      const existing = await prisma.coupon.findUnique({
        where: { tenantId_code: { tenantId, code: body.code } },
      });

      if (existing) {
        return reply.status(409).send({ message: 'Coupon code already exists in this tenant' });
      }

      const coupon = await prisma.coupon.create({
        data: {
          tenantId,
          campaignId: body.campaignId,
          code: body.code,
          type: body.type,
          value: body.value,
          minOrderValue: body.minOrderValue,
          maxDiscount: body.maxDiscount,
          maxUsageTotal: body.maxUsageTotal,
          maxUsagePerCustomer: body.maxUsagePerCustomer,
          validFrom: body.validFrom,
          validUntil: body.validUntil,
          isActive: body.isActive,
          applicableTo: body.applicableTo,
          targetIds: body.targetIds,
          customerId: body.customerId,
        },
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.SALES.COUPON_CREATE,
        entityId: coupon.id,
        placeholders: {
          userName: userId,
          couponCode: coupon.code,
        },
        newData: { code: body.code, type: body.type, value: body.value },
      });

      return reply.status(201).send({
        coupon: {
          ...coupon,
          value: Number(coupon.value),
          minOrderValue: coupon.minOrderValue ? Number(coupon.minOrderValue) : null,
          maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
          maxUsageTotal: coupon.maxUsageTotal ?? null,
          campaignId: coupon.campaignId ?? null,
          aiReason: coupon.aiReason ?? null,
          customerId: coupon.customerId ?? null,
        },
      });
    },
  });
}
