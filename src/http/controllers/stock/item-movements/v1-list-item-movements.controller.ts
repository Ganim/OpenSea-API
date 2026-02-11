import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
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
        permissionCode: PermissionCodes.STOCK.MOVEMENTS.LIST,
        resource: 'item-movements',
      }),
    ],
    schema: {
      tags: ['Stock - Item Movements'],
      summary: 'List item movements',
      querystring: z.object({
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
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const filters = request.query;

      const listItemMovementsUseCase = makeListItemMovementsUseCase();
      const { movements } = await listItemMovementsUseCase.execute({
        tenantId,
        ...filters,
      });

      // Enrich movements with user profile data
      const userIds = [...new Set(movements.map((m) => m.userId))];
      const userProfiles =
        userIds.length > 0
          ? await prisma.userProfile.findMany({
              where: { userId: { in: userIds } },
              select: { userId: true, name: true, surname: true },
            })
          : [];
      const userMap = new Map(
        userProfiles.map((p) => [
          p.userId,
          `${p.name} ${p.surname}`.trim() || null,
        ]),
      );

      const enrichedMovements = movements.map((m) => ({
        ...m,
        user: userMap.has(m.userId)
          ? { id: m.userId, name: userMap.get(m.userId)! }
          : null,
      }));

      return reply.status(200).send({ movements: enrichedMovements });
    },
  });
}
