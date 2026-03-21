import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeListInventorySessionsUseCase } from '@/use-cases/stock/inventory/factories/make-list-inventory-sessions-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const listInventorySessionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['OPEN', 'PAUSED', 'COMPLETED', 'CANCELLED']).optional(),
  mode: z.enum(['BIN', 'ZONE', 'PRODUCT']).optional(),
});

const sessionSchema = z.object({
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
});

const listResponseSchema = z.object({
  data: z.array(sessionSchema),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    pages: z.number(),
  }),
});

export async function listInventorySessionsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/stock/inventory-sessions',
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
      summary: 'List inventory sessions',
      querystring: listInventorySessionsQuerySchema,
      response: {
        200: listResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { page, limit, status, mode } = request.query;

      const useCase = makeListInventorySessionsUseCase();
      const result = await useCase.execute({
        tenantId,
        page,
        limit,
        status,
        mode,
      });

      return reply.status(200).send({
        data: result.sessions.data.map((session) => ({
          id: session.id.toString(),
          userId: session.userId.toString(),
          status: session.status,
          mode: session.mode,
          binId: session.binId?.toString() ?? null,
          zoneId: session.zoneId?.toString() ?? null,
          productId: session.productId?.toString() ?? null,
          variantId: session.variantId?.toString() ?? null,
          totalItems: session.totalItems,
          scannedItems: session.scannedItems,
          confirmedItems: session.confirmedItems,
          divergentItems: session.divergentItems,
          notes: session.notes ?? null,
          startedAt: session.startedAt,
          completedAt: session.completedAt ?? null,
          createdAt: session.createdAt,
        })),
        meta: {
          total: result.sessions.total,
          page: result.sessions.page,
          limit: result.sessions.limit,
          pages: result.sessions.totalPages,
        },
      });
    },
  });
}
