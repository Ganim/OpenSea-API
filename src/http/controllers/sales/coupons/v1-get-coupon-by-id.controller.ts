import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { couponResponseSchema } from '@/http/schemas';
import { prisma } from '@/lib/prisma';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getCouponByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/coupons/:id',
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
      summary: 'Get a coupon by ID',
      params: z.object({
        id: z.string().uuid().describe('Coupon UUID'),
      }),
      response: {
        200: z.object({
          coupon: couponResponseSchema,
        }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;

      const coupon = await prisma.coupon.findFirst({
        where: { id, tenantId },
      });

      if (!coupon) {
        return reply.status(404).send({ message: 'Coupon not found' });
      }

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
