import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
import { purchaseOrderToDTO } from '@/mappers/stock/purchase-order/purchase-order-to-dto';
import { makeCreatePurchaseOrderUseCase } from '@/use-cases/stock/purchase-orders/factories/make-create-purchase-order-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createPurchaseOrderController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/purchase-orders',
    preHandler: [verifyJwt, verifyUserManager],
    schema: {
      tags: ['Purchase Orders'],
      summary: 'Create a new purchase order',
      body: z.object({
        orderNumber: z.string().min(1).max(50),
        supplierId: z.string().uuid(),
        status: z.string().optional(),
        expectedDate: z.coerce.date().optional(),
        notes: z.string().max(1000).optional(),
        items: z
          .array(
            z.object({
              variantId: z.string().uuid(),
              quantity: z.number().positive(),
              unitCost: z.number().min(0),
              notes: z.string().max(500).optional(),
            }),
          )
          .min(1),
      }),
      response: {
        201: z.object({
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
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const data = request.body;

      try {
        const createPurchaseOrderUseCase = makeCreatePurchaseOrderUseCase();
        const { purchaseOrder } = await createPurchaseOrderUseCase.execute({
          ...data,
          createdBy: userId,
        });

        return reply
          .status(201)
          .send({ purchaseOrder: purchaseOrderToDTO(purchaseOrder) });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
