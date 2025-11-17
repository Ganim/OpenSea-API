import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import {
  createItemReservationSchema,
  itemReservationResponseSchema,
} from '@/http/schemas/sales.schema';
import { makeCreateItemReservationUseCase } from '@/use-cases/sales/item-reservations/factories/make-create-item-reservation-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function createItemReservationController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/item-reservations',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Item Reservations'],
      summary: 'Create a new item reservation',
      body: createItemReservationSchema,
      response: {
        201: z.object({ reservation: itemReservationResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      try {
        const useCase = makeCreateItemReservationUseCase();
        const { reservation } = await useCase.execute(request.body);

        return reply.status(201).send({ reservation });
      } catch (err) {
        if (err instanceof BadRequestError) {
          return reply.status(400).send({ message: err.message });
        }
        if (err instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
