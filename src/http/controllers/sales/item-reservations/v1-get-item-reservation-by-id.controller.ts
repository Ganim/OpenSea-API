import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { itemReservationResponseSchema } from '@/http/schemas/sales.schema';
import { makeGetItemReservationByIdUseCase } from '@/use-cases/sales/item-reservations/factories/make-get-item-reservation-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getItemReservationByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/item-reservations/:id',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Sales - Item Reservations'],
      summary: 'Get item reservation by ID',
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({ reservation: itemReservationResponseSchema }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const useCase = makeGetItemReservationByIdUseCase();
        const { reservation } = await useCase.execute({ id });

        return reply.status(200).send({ reservation });
      } catch (err) {
        if (err instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
