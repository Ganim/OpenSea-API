import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeScanInventoryItemUseCase } from '@/use-cases/stock/inventory/factories/make-scan-inventory-item-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const scanBodySchema = z.object({
  code: z.string().min(1).max(512),
});

const scanResponseSchema = z.object({
  session: z.object({
    id: z.string(),
    scannedItems: z.number(),
    confirmedItems: z.number(),
    divergentItems: z.number(),
    totalItems: z.number(),
  }),
  sessionItem: z.object({
    id: z.string(),
    itemId: z.string(),
    status: z.string(),
    expectedBinId: z.string().nullable(),
    actualBinId: z.string().nullable(),
    scannedAt: z.date().nullable(),
  }),
  scanResult: z.enum(['CONFIRMED', 'WRONG_BIN', 'EXTRA']),
});

export async function scanInventoryItemController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/stock/inventory-sessions/:id/scan',
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
      summary: 'Scan an item during inventory session',
      params: paramsSchema,
      body: scanBodySchema,
      response: {
        200: scanResponseSchema,
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;
      const { code } = request.body;

      const useCase = makeScanInventoryItemUseCase();
      const result = await useCase.execute({
        tenantId,
        sessionId: id,
        scannedCode: code,
      });

      return reply.status(200).send({
        session: {
          id: result.session.id.toString(),
          scannedItems: result.session.scannedItems,
          confirmedItems: result.session.confirmedItems,
          divergentItems: result.session.divergentItems,
          totalItems: result.session.totalItems,
        },
        sessionItem: {
          id: result.sessionItem.id.toString(),
          itemId: result.sessionItem.itemId.toString(),
          status: result.sessionItem.status,
          expectedBinId: result.sessionItem.expectedBinId?.toString() ?? null,
          actualBinId: result.sessionItem.actualBinId?.toString() ?? null,
          scannedAt: result.sessionItem.scannedAt ?? null,
        },
        scanResult: result.scanResult,
      });
    },
  });
}
