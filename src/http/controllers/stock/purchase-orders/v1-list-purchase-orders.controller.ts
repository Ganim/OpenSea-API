import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { makeListPurchaseOrdersUseCase } from '@/use-cases/stock/purchase-orders/factories/make-list-purchase-orders-use-case';

import { verifyJwt } from '../../../middlewares/verify-jwt';

export async function listPurchaseOrdersController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/v1/purchase-orders',
    {
      onRequest: [verifyJwt],
      schema: {
        summary: 'List purchase orders',
        description: 'Returns a list of purchase orders with optional filters',
        tags: ['Purchase Orders'],
        security: [{ bearerAuth: [] }],
        querystring: z.object({
          supplierId: z.uuid().optional(),
          status: z
            .enum(['PENDING', 'CONFIRMED', 'DELIVERED', 'CANCELLED'])
            .optional(),
        }),
        response: {
          200: z.object({
            purchaseOrders: z.array(
              z.object({
                id: z.string(),
                orderNumber: z.string(),
                status: z.string(),
                supplierId: z.string(),
                createdBy: z.string().nullable(),
                totalCost: z.number(),
                expectedDate: z.date().nullable(),
                receivedDate: z.date().nullable(),
                notes: z.string().nullable(),
                items: z.array(
                  z.object({
                    id: z.string(),
                    orderId: z.string(),
                    variantId: z.string(),
                    quantity: z.number(),
                    unitCost: z.number(),
                    totalCost: z.number(),
                    notes: z.string().nullable(),
                    createdAt: z.date(),
                    updatedAt: z.date().nullable(),
                  }),
                ),
                createdAt: z.date(),
                updatedAt: z.date().nullable(),
                deletedAt: z.date().nullable(),
              }),
            ),
          }),
        },
      },
    },
    async (request, reply) => {
      const { supplierId, status } = request.query;

      const listPurchaseOrdersUseCase = makeListPurchaseOrdersUseCase();

      const { purchaseOrders } = await listPurchaseOrdersUseCase.execute({
        supplierId,
        status,
      });

      return reply.status(200).send({
        purchaseOrders,
      });
    },
  );
}
