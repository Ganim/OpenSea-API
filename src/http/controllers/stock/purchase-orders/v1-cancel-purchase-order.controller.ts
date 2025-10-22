import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { purchaseOrderToDTO } from '@/mappers/stock/purchase-order/purchase-order-to-dto';
import { makeCancelPurchaseOrderUseCase } from '@/use-cases/stock/purchase-orders/factories/make-cancel-purchase-order-use-case';

import { verifyJwt } from '../../../middlewares/verify-jwt';
import { verifyUserManager } from '../../../middlewares/verify-user-manager';

export async function cancelPurchaseOrderController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/v1/purchase-orders/:orderId/cancel',
    {
      onRequest: [verifyJwt, verifyUserManager],
      schema: {
        summary: 'Cancel purchase order',
        description: 'Cancels an existing purchase order',
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
          400: z.object({
            message: z.string(),
          }),
          404: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { orderId } = request.params;

      try {
        const cancelPurchaseOrderUseCase = makeCancelPurchaseOrderUseCase();

        const { purchaseOrder } = await cancelPurchaseOrderUseCase.execute({
          id: orderId,
        });

        return reply.status(200).send({
          purchaseOrder: purchaseOrderToDTO(purchaseOrder),
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }

        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }

        throw error;
      }
    },
  );
}
