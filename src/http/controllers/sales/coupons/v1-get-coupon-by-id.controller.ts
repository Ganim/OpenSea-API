import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { couponResponseSchema } from '@/http/schemas';
import { makeGetCouponByIdUseCase } from '@/use-cases/sales/coupons/factories/make-get-coupon-by-id-use-case';
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

      try {
        const useCase = makeGetCouponByIdUseCase();
        const { coupon } = await useCase.execute({ id, tenantId });

        return reply.status(200).send({
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
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
