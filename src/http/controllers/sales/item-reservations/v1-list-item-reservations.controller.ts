import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { itemReservationResponseSchema } from '@/http/schemas/sales.schema';
import { makeListItemReservationsUseCase } from '@/use-cases/sales/item-reservations/factories/make-list-item-reservations-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listItemReservationsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/item-reservations',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Item Reservations'],
      summary: 'List item reservations',
      querystring: z.object({
        itemId: z.string().uuid().optional(),
        userId: z.string().uuid().optional(),
        activeOnly: z.coerce.boolean().optional(),
      }),
      response: {
        200: z.object({
          reservations: z.array(itemReservationResponseSchema),
        }),
      },
    },
    handler: async (request, reply) => {
      const { itemId, userId, activeOnly } = request.query as {
        itemId?: string;
        userId?: string;
        activeOnly?: boolean;
      };

      const useCase = makeListItemReservationsUseCase();
      const { reservations } = await useCase.execute({
        itemId,
        userId,
        activeOnly,
      });

      return reply.status(200).send({ reservations });
    },
  });
}
