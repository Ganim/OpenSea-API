import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeResolveDivergenceUseCase } from '@/use-cases/stock/inventory/factories/make-resolve-divergence-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const paramsSchema = z.object({
  id: z.string().uuid(),
  itemId: z.string().uuid(),
});

const resolveBodySchema = z.object({
  resolution: z.enum([
    'LOSS_REGISTERED',
    'TRANSFERRED',
    'ENTRY_CREATED',
    'PENDING_REVIEW',
  ]),
  notes: z.string().max(2000).optional(),
});

const resolveResponseSchema = z.object({
  sessionItem: z.object({
    id: z.string(),
    itemId: z.string(),
    status: z.string(),
    resolution: z.string().nullable(),
    resolvedBy: z.string().nullable(),
    resolvedAt: z.date().nullable(),
    notes: z.string().nullable(),
  }),
});

export async function resolveDivergenceController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/stock/inventory-sessions/:id/items/:itemId/resolve',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.INVENTORY.MODIFY,
        resource: 'inventory',
      }),
    ],
    schema: {
      tags: ['Stock - Inventory Sessions'],
      summary: 'Resolve a divergent inventory item',
      params: paramsSchema,
      body: resolveBodySchema,
      response: {
        200: resolveResponseSchema,
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { id, itemId } = request.params;
      const { resolution, notes } = request.body;

      const useCase = makeResolveDivergenceUseCase();
      const result = await useCase.execute({
        tenantId,
        sessionId: id,
        sessionItemId: itemId,
        resolution,
        userId,
        notes,
      });

      return reply.status(200).send({
        sessionItem: {
          id: result.sessionItem.id.toString(),
          itemId: result.sessionItem.itemId.toString(),
          status: result.sessionItem.status,
          resolution: result.sessionItem.resolution ?? null,
          resolvedBy: result.sessionItem.resolvedBy?.toString() ?? null,
          resolvedAt: result.sessionItem.resolvedAt ?? null,
          notes: result.sessionItem.notes ?? null,
        },
      });
    },
  });
}
