import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
import {
  createPurchaseOrderSchema,
  purchaseOrderResponseSchema,
} from '@/http/schemas';
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
      body: createPurchaseOrderSchema,
      response: {
        201: z.object({
          purchaseOrder: purchaseOrderResponseSchema,
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

        return reply.status(201).send({ purchaseOrder });
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
