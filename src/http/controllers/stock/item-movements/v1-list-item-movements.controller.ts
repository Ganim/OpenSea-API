import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { paginationSchema } from '@/http/schemas';
import { itemMovementResponseSchema } from '@/http/schemas/stock.schema';
import { prisma } from '@/lib/prisma';
import { makeListItemMovementsUseCase } from '@/use-cases/stock/item-movements/factories/make-list-item-movements-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listItemMovementsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/item-movements',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.ITEMS.ACCESS,
        resource: 'item-movements',
      }),
    ],
    schema: {
      tags: ['Stock - Item Movements'],
      summary: 'List item movements',
      querystring: paginationSchema.extend({
        itemId: z.uuid().optional(),
        userId: z.uuid().optional(),
        movementType: z.string().optional(),
        salesOrderId: z.uuid().optional(),
        batchNumber: z.string().optional(),
        pendingApproval: z.coerce.boolean().optional(),
      }),
      response: {
        200: z.object({
          movements: z.array(itemMovementResponseSchema),
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
      const { page, limit, ...filters } = request.query;

      const listItemMovementsUseCase = makeListItemMovementsUseCase();
      const { movements, meta } = await listItemMovementsUseCase.execute({
        tenantId,
        page,
        limit,
        ...filters,
      });

      // Enrich movements with user profile data (fallback to User.name/username)
      const userIds = [...new Set(movements.map((m) => m.userId))];

      const [userProfiles, users] = userIds.length > 0
        ? await Promise.all([
            prisma.userProfile.findMany({
              where: { userId: { in: userIds } },
              select: { userId: true, name: true, surname: true },
            }),
            prisma.user.findMany({
              where: { id: { in: userIds } },
              select: { id: true, username: true, email: true },
            }),
          ])
        : [[], []];

      const profileMap = new Map(
        userProfiles.map((p) => [p.userId, `${p.name} ${p.surname}`.trim()]),
      );
      const userFallbackMap = new Map(
        users.map((u) => [u.id, u.username || u.email]),
      );

      const enrichedMovements = movements.map((m) => {
        const userName = profileMap.get(m.userId) || userFallbackMap.get(m.userId);
        return {
          ...m,
          user: userName ? { id: m.userId, name: userName } : null,
        };
      });

      return reply.status(200).send({ movements: enrichedMovements, meta });
    },
  });
}
