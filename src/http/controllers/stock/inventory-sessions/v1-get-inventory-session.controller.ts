import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetInventorySessionUseCase } from '@/use-cases/stock/inventory/factories/make-get-inventory-session-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const sessionDetailResponseSchema = z.object({
  session: z.object({
    id: z.string(),
    userId: z.string(),
    status: z.string(),
    mode: z.string(),
    binId: z.string().nullable(),
    zoneId: z.string().nullable(),
    productId: z.string().nullable(),
    variantId: z.string().nullable(),
    totalItems: z.number(),
    scannedItems: z.number(),
    confirmedItems: z.number(),
    divergentItems: z.number(),
    notes: z.string().nullable(),
    startedAt: z.date(),
    completedAt: z.date().nullable(),
    createdAt: z.date(),
  }),
  items: z.array(
    z.object({
      id: z.string(),
      itemId: z.string(),
      expectedBinId: z.string().nullable(),
      actualBinId: z.string().nullable(),
      status: z.string(),
      scannedAt: z.date().nullable(),
      resolution: z.string().nullable(),
      resolvedBy: z.string().nullable(),
      resolvedAt: z.date().nullable(),
      notes: z.string().nullable(),
    }),
  ),
});

export async function getInventorySessionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/stock/inventory-sessions/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.INVENTORY.ACCESS,
        resource: 'inventory',
      }),
    ],
    schema: {
      tags: ['Stock - Inventory Sessions'],
      summary: 'Get inventory session details',
      params: paramsSchema,
      response: {
        200: sessionDetailResponseSchema,
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;

      const useCase = makeGetInventorySessionUseCase();
      const result = await useCase.execute({
        tenantId,
        sessionId: id,
      });

      return reply.status(200).send({
        session: {
          id: result.session.id.toString(),
          userId: result.session.userId.toString(),
          status: result.session.status,
          mode: result.session.mode,
          binId: result.session.binId?.toString() ?? null,
          zoneId: result.session.zoneId?.toString() ?? null,
          productId: result.session.productId?.toString() ?? null,
          variantId: result.session.variantId?.toString() ?? null,
          totalItems: result.session.totalItems,
          scannedItems: result.session.scannedItems,
          confirmedItems: result.session.confirmedItems,
          divergentItems: result.session.divergentItems,
          notes: result.session.notes ?? null,
          startedAt: result.session.startedAt,
          completedAt: result.session.completedAt ?? null,
          createdAt: result.session.createdAt,
        },
        items: result.items.map((item) => ({
          id: item.id.toString(),
          itemId: item.itemId.toString(),
          expectedBinId: item.expectedBinId?.toString() ?? null,
          actualBinId: item.actualBinId?.toString() ?? null,
          status: item.status,
          scannedAt: item.scannedAt ?? null,
          resolution: item.resolution ?? null,
          resolvedBy: item.resolvedBy?.toString() ?? null,
          resolvedAt: item.resolvedAt ?? null,
          notes: item.notes ?? null,
        })),
      });
    },
  });
}
