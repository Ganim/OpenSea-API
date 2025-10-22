import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
import { makeRegisterItemEntryUseCase } from '@/use-cases/stock/items/factories/make-register-item-entry-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function registerItemEntryController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/items/entry',
    preHandler: [verifyJwt, verifyUserManager],
    schema: {
      tags: ['Items'],
      summary: 'Register item entry',
      body: z.object({
        uniqueCode: z.string().min(1).max(128),
        variantId: z.string().uuid(),
        locationId: z.string().uuid(),
        quantity: z.number().positive(),
        attributes: z.record(z.string(), z.unknown()).optional(),
        batchNumber: z.string().max(100).optional(),
        manufacturingDate: z.coerce.date().optional(),
        expiryDate: z.coerce.date().optional(),
        notes: z.string().max(1000).optional(),
      }),
      response: {
        201: z.object({
          item: z.object({
            id: z.string(),
            uniqueCode: z.string(),
            variantId: z.string(),
            locationId: z.string(),
            initialQuantity: z.number(),
            currentQuantity: z.number(),
            status: z.string(),
            entryDate: z.date(),
            attributes: z.record(z.string(), z.unknown()),
            batchNumber: z.string().optional(),
            manufacturingDate: z.date().optional(),
            expiryDate: z.date().optional(),
            createdAt: z.date(),
            updatedAt: z.date().optional(),
            deletedAt: z.date().optional(),
          }),
          movement: z.object({
            id: z.string(),
            itemId: z.string(),
            userId: z.string(),
            quantity: z.number(),
            movementType: z.string(),
            createdAt: z.date(),
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
        const registerItemEntryUseCase = makeRegisterItemEntryUseCase();
        const result = await registerItemEntryUseCase.execute({
          ...data,
          userId,
        });

        return reply.status(201).send(result);
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
