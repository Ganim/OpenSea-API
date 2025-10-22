import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { purchaseOrderToDTO } from '@/mappers/stock/purchase-order/purchase-order-to-dto';
import { makeGetPurchaseOrderByIdUseCase } from '@/use-cases/stock/purchase-orders/factories/make-get-purchase-order-by-id-use-case';

import { verifyJwt } from '../../../middlewares/verify-jwt';

export async function getPurchaseOrderByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/v1/purchase-orders/:orderId',
    {
      onRequest: [verifyJwt],
      schema: {
        summary: 'Get purchase order by ID',
        description: 'Returns a single purchase order by its ID',
        tags: ['Purchase Orders'],
        security: [{ bearerAuth: [] }],
        params: z.object({
          orderId: z.string().uuid(),
        }),
        response: {
          200: z.object({
            purchaseOrder: z.object({
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
          }),
          404: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { orderId } = request.params;

      const getPurchaseOrderByIdUseCase = makeGetPurchaseOrderByIdUseCase();

      const result = await getPurchaseOrderByIdUseCase.execute({ id: orderId });

      if (!result.purchaseOrder) {
        throw new ResourceNotFoundError();
      }

      return reply.status(200).send({
        purchaseOrder: purchaseOrderToDTO(result.purchaseOrder),
      });
    },
  );
}
