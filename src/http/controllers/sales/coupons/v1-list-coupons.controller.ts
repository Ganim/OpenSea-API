import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { couponResponseSchema, listCouponsQuerySchema } from '@/http/schemas';
import { prisma } from '@/lib/prisma';
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
      const {
        page,
        limit,
        search,
        type,
        isActive,
        campaignId,
        sortBy,
        sortOrder,
      } = request.query;

      const where = {
        tenantId,
        ...(search && {
          code: { contains: search, mode: 'insensitive' as const },
        }),
        ...(type && { type }),
        ...(isActive !== undefined && { isActive: isActive === 'true' }),
        ...(campaignId && { campaignId }),
      };

      const [coupons, total] = await Promise.all([
        prisma.coupon.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { [sortBy ?? 'createdAt']: sortOrder ?? 'desc' },
        }),
        prisma.coupon.count({ where }),
      ]);

      return reply.status(200).send({
        coupons: coupons.map((c) => ({
          ...c,
          value: Number(c.value),
          minOrderValue: c.minOrderValue ? Number(c.minOrderValue) : null,
          maxDiscount: c.maxDiscount ? Number(c.maxDiscount) : null,
          maxUsageTotal: c.maxUsageTotal ?? null,
          campaignId: c.campaignId ?? null,
          aiReason: c.aiReason ?? null,
          customerId: c.customerId ?? null,
        })),
        meta: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      });
    },
  });
}
