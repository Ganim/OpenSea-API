import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeCompleteInventorySessionUseCase } from '@/use-cases/stock/inventory/factories/make-complete-inventory-session-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const sessionResponseSchema = z.object({
  session: z.object({
    id: z.string(),
    status: z.string(),
    totalItems: z.number(),
    scannedItems: z.number(),
    confirmedItems: z.number(),
    divergentItems: z.number(),
    completedAt: z.date().nullable(),
  }),
});

export async function completeInventorySessionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/stock/inventory-sessions/:id/complete',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.INVENTORY.REGISTER,
        resource: 'inventory',
      }),
    ],
    schema: {
      tags: ['Stock - Inventory Sessions'],
      summary: 'Complete an inventory session',
      params: paramsSchema,
      response: {
        200: sessionResponseSchema,
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;

      const useCase = makeCompleteInventorySessionUseCase();
      const result = await useCase.execute({
        tenantId,
        sessionId: id,
      });

      return reply.status(200).send({
        session: {
          id: result.session.id.toString(),
          status: result.session.status,
          totalItems: result.session.totalItems,
          scannedItems: result.session.scannedItems,
          confirmedItems: result.session.confirmedItems,
          divergentItems: result.session.divergentItems,
          completedAt: result.session.completedAt ?? null,
        },
      });
    },
  });
}
