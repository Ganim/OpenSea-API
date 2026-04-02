import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { couponResponseSchema, listCouponsQuerySchema } from '@/http/schemas';
import { makeListCouponsUseCase } from '@/use-cases/sales/coupons/factories/make-list-coupons-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listCouponsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/coupons',
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
      summary: 'List all coupons',
      querystring: listCouponsQuerySchema,
      response: {
        200: z.object({
          coupons: z.array(couponResponseSchema),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            pages: z.number(),
          }),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { page, limit, search, isActive } = request.query;

      const useCase = makeListCouponsUseCase();
      const { coupons } = await useCase.execute({
        tenantId,
        page,
        limit,
        search,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
      });

      return reply.status(200).send({
        coupons: coupons.data.map((c) => ({
          id: c.couponId.toString(),
          tenantId: c.tenantId.toString(),
          code: c.code,
          type: c.discountType,
          value: c.discountValue,
          applicableTo: c.applicableTo,
          minOrderValue: c.minOrderValue ?? null,
          maxDiscount: c.maxDiscountAmount ?? null,
          maxUsageTotal: c.maxUsageTotal ?? null,
          maxUsagePerCustomer: c.maxUsagePerCustomer ?? 0,
          usageCount: c.currentUsageTotal,
          validFrom: c.startDate ?? new Date(),
          validUntil: c.endDate ?? new Date(),
          isActive: c.isActive,
          campaignId: null,
          aiGenerated: false,
          aiReason: null,
          customerId: null,
          targetIds: [],
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        })),
        meta: {
          total: coupons.total,
          page: coupons.page,
          limit: coupons.limit,
          pages: coupons.totalPages,
        },
      });
    },
  });
}
