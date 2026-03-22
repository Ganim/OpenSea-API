import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { prisma } from '@/lib/prisma';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getSellerRankingController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/sales/analytics/rankings/sellers',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['Sales - Analytics Rankings'],
      summary: 'Get seller ranking by revenue',
      querystring: z.object({
        period: z
          .enum(['today', 'week', 'month', 'quarter', 'year'])
          .default('month'),
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

      // Calculate date range based on period
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case 'today':
          startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
          );
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          startDate = new Date(
            now.getFullYear(),
            Math.floor(now.getMonth() / 3) * 3,
            1,
          );
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      // Query orders grouped by assigned user (seller)
      const rankings = await prisma.order.groupBy({
        by: ['assignedToUserId'],
        where: {
          tenantId,
          createdAt: { gte: startDate },
          assignedToUserId: { not: null },
          deletedAt: null,
        },
        _sum: { grandTotal: true },
        _count: { _all: true },
        orderBy: { _sum: { grandTotal: 'desc' } },
        take: limit,
      });

      // Enrich with user names
      const userIds = rankings
        .map((r) => r.assignedToUserId)
        .filter((id): id is string => id !== null);

      const users =
        userIds.length > 0
          ? await prisma.user.findMany({
              where: { id: { in: userIds } },
              include: { profile: true },
            })
          : [];

      const userMap = new Map(
        users.map((u) => [
          u.id,
          u.profile
            ? `${u.profile.name} ${u.profile.surname || ''}`.trim()
            : u.email,
        ]),
      );

      const enrichedRankings = rankings.map((r, index) => ({
        rank: index + 1,
        userId: r.assignedToUserId,
        name: r.assignedToUserId
          ? (userMap.get(r.assignedToUserId) ?? 'Desconhecido')
          : 'Desconhecido',
        totalRevenue: Number(r._sum?.grandTotal ?? 0),
        orderCount: r._count?._all ?? 0,
      }));

      return reply.status(200).send({
        rankings: enrichedRankings,
        period,
      });
    },
  });
}
