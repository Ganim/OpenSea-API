import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { orderResponseSchema } from '@/http/schemas/sales/orders/order.schema';
import { orderToDTO } from '@/mappers/sales/order/order-to-dto';
import { makeSyncOfflineOrdersUseCase } from '@/use-cases/sales/orders/factories/make-sync-offline-orders-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1SyncOfflineOrdersController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/orders/sync-offline',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.POS.SELL,
        resource: 'orders',
      }),
    ],
    schema: {
      tags: ['PDV'],
      summary: 'Sync offline PDV orders',
      body: z.object({
        orders: z
          .array(
            z.object({
              offlineRef: z.string().max(16).optional(),
              customerId: z.string().uuid().optional(),
              terminalId: z.string().uuid().optional(),
              sendToCashier: z.boolean().optional(),
              items: z
                .array(
                  z.object({
                    variantId: z.string().uuid(),
                    quantity: z.number().positive().optional(),
                  }),
                )
                .min(1),
            }),
          )
          .min(1)
          .max(100),
      }),
      response: {
        200: z.object({
          synced: z.array(
            z.object({
              offlineRef: z.string().optional(),
              order: orderResponseSchema.optional(),
            }),
          ),
          failed: z.array(
            z.object({
              offlineRef: z.string().optional(),
              error: z.string(),
            }),
          ),
        }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;

      const useCase = makeSyncOfflineOrdersUseCase();
      const result = await useCase.execute({
        tenantId,
        userId,
        orders: request.body.orders,
      });

      return reply.status(200).send({
        synced: result.synced.map((item) => ({
          offlineRef: item.offlineRef,
          order: item.order ? orderToDTO(item.order) : undefined,
        })),
        failed: result.failed.map((item) => ({
          offlineRef: item.offlineRef,
          error: item.error || 'Unknown sync error',
        })),
      });
    },
  });
}
