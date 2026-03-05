import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { cardResponseSchema, moveCardSchema } from '@/http/schemas/tasks';
import { makeMoveCardUseCase } from '@/use-cases/tasks/cards/factories/make-move-card-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function moveCardController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/tasks/boards/:boardId/cards/:cardId/move',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TASKS.CARDS.MOVE,
        resource: 'task-cards',
      }),
    ],
    schema: {
      tags: ['Tasks - Cards'],
      summary: 'Move a card to another column',
      security: [{ bearerAuth: [] }],
      params: z.object({
        boardId: z.string().uuid(),
        cardId: z.string().uuid(),
      }),
      body: moveCardSchema,
      response: {
        200: z.object({ card: cardResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { boardId, cardId } = request.params;

      try {
        const useCase = makeMoveCardUseCase();
        const result = await useCase.execute({
          tenantId,
          userId,
          userName: 'System',
          boardId,
          cardId,
          ...request.body,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.TASKS.CARD_MOVE,
          entityId: cardId,
          placeholders: { userName: 'System', cardTitle: result.card.title },
          newData: request.body,
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
