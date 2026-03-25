import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { couponResponseSchema, updateCouponSchema } from '@/http/schemas';
import { prisma } from '@/lib/prisma';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updateCouponController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/coupons/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.COUPONS.MODIFY,
        resource: 'coupons',
      }),
    ],
    schema: {
      tags: ['Sales - Coupons'],
      summary: 'Update a coupon',
      params: z.object({
        id: z.string().uuid().describe('Coupon UUID'),
      }),
      body: updateCouponSchema,
      response: {
        200: z.object({
          coupon: couponResponseSchema,
        }),
        404: z.object({ message: z.string() }),
        409: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { id } = request.params;
      const body = request.body;

      const existingCoupon = await prisma.coupon.findFirst({
        where: { id, tenantId },
      });

      if (!existingCoupon) {
        return reply.status(404).send({ message: 'Coupon not found' });
      }

      // Check for duplicate code if code is being changed
      if (body.code && body.code !== existingCoupon.code) {
        const duplicateCoupon = await prisma.coupon.findUnique({
          where: { tenantId_code: { tenantId, code: body.code } },
        });

        if (duplicateCoupon) {
          return reply
            .status(409)
            .send({ message: 'Coupon code already exists in this tenant' });
        }
      }

      const coupon = await prisma.coupon.update({
        where: { id },
        data: {
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
        message: AUDIT_MESSAGES.SALES.COUPON_UPDATE,
        entityId: coupon.id,
        placeholders: {
          userName: userId,
          couponCode: coupon.code,
        },
        oldData: {
          code: existingCoupon.code,
          type: existingCoupon.type,
          value: Number(existingCoupon.value),
        },
        newData: {
          code: coupon.code,
          type: coupon.type,
          value: Number(coupon.value),
        },
      });

      return reply.status(200).send({
        coupon: {
          ...coupon,
          value: Number(coupon.value),
          minOrderValue: coupon.minOrderValue
            ? Number(coupon.minOrderValue)
            : null,
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
