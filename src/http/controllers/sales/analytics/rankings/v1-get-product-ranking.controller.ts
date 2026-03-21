import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { prisma } from '@/lib/prisma';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getProductRankingController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/sales/analytics/rankings/products',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['Sales - Analytics Rankings'],
      summary: 'Get product ranking by revenue',
      querystring: z.object({
        period: z.enum(['today', 'week', 'month', 'quarter', 'year']).default('month'),
        limit: z.coerce.number().int().positive().max(50).default(10),
      }),
      response: {
        200: z.object({
          rankings: z.array(z.any()),
          period: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { period, limit } = request.query;

      const now = new Date();
      let startDate: Date;

      switch (period) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      // Query order items grouped by variant
      const rankings = await prisma.orderItem.groupBy({
        by: ['variantId'],
        where: {
          order: {
            tenantId,
            createdAt: { gte: startDate },
            deletedAt: null,
          },
        },
        _sum: { totalPrice: true, quantity: true },
        _count: { id: true },
        orderBy: { _sum: { totalPrice: 'desc' } },
        take: limit,
      });

      // Enrich with variant/product names
      const variantIds = rankings.map((r) => r.variantId);

      const variants = variantIds.length > 0
        ? await prisma.variant.findMany({
            where: { id: { in: variantIds } },
            include: { product: { select: { name: true } } },
          })
        : [];

      const variantMap = new Map(variants.map((v) => [
        v.id,
        { name: v.product.name, sku: v.sku },
      ]));

      const enrichedRankings = rankings.map((r, index) => ({
        rank: index + 1,
        variantId: r.variantId,
        productName: variantMap.get(r.variantId)?.name ?? 'Desconhecido',
        sku: variantMap.get(r.variantId)?.sku ?? '',
        totalRevenue: Number(r._sum.totalPrice ?? 0),
        totalQuantity: Number(r._sum.quantity ?? 0),
        orderCount: r._count.id,
      }));

      return reply.status(200).send({
        rankings: enrichedRankings,
        period,
      });
    },
  });
}
