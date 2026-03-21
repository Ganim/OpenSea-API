import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeCreateInventorySessionUseCase } from '@/use-cases/stock/inventory/factories/make-create-inventory-session-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const createInventorySessionBodySchema = z.object({
  mode: z.enum(['BIN', 'ZONE', 'PRODUCT']),
  binId: z.string().uuid().optional(),
  zoneId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  variantId: z.string().uuid().optional(),
  notes: z.string().max(2000).optional(),
});

const inventorySessionResponseSchema = z.object({
  session: z.object({
    id: z.string(),
    status: z.string(),
    mode: z.string(),
    totalItems: z.number(),
    scannedItems: z.number(),
    confirmedItems: z.number(),
    divergentItems: z.number(),
    notes: z.string().nullable(),
    startedAt: z.date(),
    createdAt: z.date(),
  }),
  items: z.array(
    z.object({
      id: z.string(),
      itemId: z.string(),
      status: z.string(),
    }),
  ),
});

export async function createInventorySessionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/stock/inventory-sessions',
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
      summary: 'Create a new inventory session',
      body: createInventorySessionBodySchema,
      response: {
        201: inventorySessionResponseSchema,
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;

      const useCase = makeCreateInventorySessionUseCase();
      const result = await useCase.execute({
        tenantId,
        userId,
        ...request.body,
      });

      return reply.status(201).send({
        session: {
          id: result.session.id.toString(),
          status: result.session.status,
          mode: result.session.mode,
          totalItems: result.session.totalItems,
          scannedItems: result.session.scannedItems,
          confirmedItems: result.session.confirmedItems,
          divergentItems: result.session.divergentItems,
          notes: result.session.notes ?? null,
          startedAt: result.session.startedAt,
          createdAt: result.session.createdAt,
        },
        items: result.items.map((item) => ({
          id: item.id.toString(),
          itemId: item.itemId.toString(),
          status: item.status,
        })),
      });
    },
  });
}
