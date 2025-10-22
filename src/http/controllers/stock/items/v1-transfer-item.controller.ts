import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
import { makeTransferItemUseCase } from '@/use-cases/stock/items/factories/make-transfer-item-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function transferItemController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/items/transfer',
    preHandler: [verifyJwt, verifyUserManager],
    schema: {
      tags: ['Items'],
      summary: 'Transfer item to another location',
      body: z.object({
        itemId: z.string().uuid(),
        destinationLocationId: z.string().uuid(),
        reasonCode: z.string().max(50).optional(),
        notes: z.string().max(1000).optional(),
      }),
      response: {
        200: z.object({
          item: z.object({
            id: z.string().uuid(),
            uniqueCode: z.string(),
            initialQuantity: z.number(),
            currentQuantity: z.number(),
            status: z.string(),
            variantId: z.string().uuid(),
            locationId: z.string().uuid(),
            batchNumber: z.string().nullable(),
            manufacturingDate: z.coerce.date().nullable(),
            expiryDate: z.coerce.date().nullable(),
            notes: z.string().nullable(),
            attributes: z.record(z.string(), z.unknown()),
            createdAt: z.coerce.date(),
            updatedAt: z.coerce.date(),
          }),
          movement: z.object({
            id: z.string().uuid(),
            itemId: z.string().uuid(),
            userId: z.string().uuid(),
            quantity: z.number(),
            quantityBefore: z.number().nullable(),
            quantityAfter: z.number().nullable(),
            movementType: z.string(),
            reasonCode: z.string().nullable(),
            destinationRef: z.string().nullable(),
            notes: z.string().nullable(),
            approvedBy: z.string().uuid().nullable(),
            approvedAt: z.coerce.date().nullable(),
            createdAt: z.coerce.date(),
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
        const transferItemUseCase = makeTransferItemUseCase();
        const result = await transferItemUseCase.execute({
          ...data,
          userId,
        });

        return reply.status(200).send(result);
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
