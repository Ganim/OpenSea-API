import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { itemReservationResponseSchema } from '@/http/schemas/sales.schema';
import { makeReleaseItemReservationUseCase } from '@/use-cases/sales/item-reservations/factories/make-release-item-reservation-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function releaseItemReservationController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/item-reservations/:id/release',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Sales - Item Reservations'],
      summary: 'Release an item reservation',
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({ reservation: itemReservationResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const useCase = makeReleaseItemReservationUseCase();
        const { reservation } = await useCase.execute({ id });

        return reply.status(200).send({ reservation });
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
