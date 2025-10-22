import { verifyJwt } from '@/http/middlewares/verify-jwt';
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
        itemId: z.string().uuid().optional(),
        userId: z.string().uuid().optional(),
        movementType: z.string().optional(),
        salesOrderId: z.string().uuid().optional(),
        batchNumber: z.string().optional(),
        pendingApproval: z.coerce.boolean().optional(),
      }),
      response: {
        200: z.object({
          movements: z.array(
            z.object({
              id: z.string().uuid(),
              itemId: z.string().uuid(),
              userId: z.string().uuid(),
              quantity: z.number(),
              quantityBefore: z.number().nullable(),
              quantityAfter: z.number().nullable(),
              movementType: z.string(),
              reasonCode: z.string().nullable(),
              destinationRef: z.string().nullable(),
              batchNumber: z.string().nullable(),
              notes: z.string().nullable(),
              approvedBy: z.string().uuid().nullable(),
              salesOrderId: z.string().uuid().nullable(),
              createdAt: z.coerce.date(),
            }),
          ),
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
