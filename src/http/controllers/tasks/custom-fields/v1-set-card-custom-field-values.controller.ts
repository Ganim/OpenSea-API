import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  cardCustomFieldValueResponseSchema,
  setCardCustomFieldValuesSchema,
} from '@/http/schemas/tasks';
import { makeSetCardCustomFieldValuesUseCase } from '@/use-cases/tasks/custom-fields/factories/make-set-card-custom-field-values-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function setCardCustomFieldValuesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/tasks/boards/:boardId/cards/:cardId/custom-fields',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TASKS.CARDS.UPDATE,
        resource: 'task-cards',
      }),
    ],
    schema: {
      tags: ['Tasks - Custom Fields'],
      summary: 'Set custom field values for a card',
      security: [{ bearerAuth: [] }],
      params: z.object({
        boardId: z.string().uuid(),
        cardId: z.string().uuid(),
      }),
      body: setCardCustomFieldValuesSchema,
      response: {
        200: z.object({
          values: z.array(cardCustomFieldValueResponseSchema),
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const { boardId, cardId } = request.params;

      try {
        const useCase = makeSetCardCustomFieldValuesUseCase();
        const result = await useCase.execute({
          boardId,
          cardId,
          values: request.body.values,
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
