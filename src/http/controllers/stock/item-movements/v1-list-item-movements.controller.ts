import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { itemMovementResponseSchema } from '@/http/schemas/stock.schema';
import { makeListItemMovementsUseCase } from '@/use-cases/stock/item-movements/factories/make-list-item-movements-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listItemMovementsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/item-movements',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Item Movements'],
      summary: 'List item movements',
      querystring: z.object({
        itemId: z.uuid().optional(),
        userId: z.uuid().optional(),
        movementType: z.string().optional(),
        salesOrderId: z.uuid().optional(),
        batchNumber: z.string().optional(),
        pendingApproval: z.coerce.boolean().optional(),
      }),
      response: {
        200: z.object({
          movements: z.array(itemMovementResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const filters = request.query;

      const listItemMovementsUseCase = makeListItemMovementsUseCase();
      const { movements } = await listItemMovementsUseCase.execute(filters);

      return reply.status(200).send({ movements });
    },
  });
}
