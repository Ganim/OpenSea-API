import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { resolveUserName } from '@/http/helpers/resolve-user-name';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { PrismaCardsRepository } from '@/repositories/tasks/prisma/prisma-cards-repository';
import { makeDeleteCardUseCase } from '@/use-cases/tasks/cards/factories/make-delete-card-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function deleteCardController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/tasks/boards/:boardId/cards/:cardId',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.TASK_CARDS.REMOVE,
        resource: 'task-cards',
      }),
    ],
    schema: {
      tags: ['Tasks - Cards'],
      summary: 'Delete a card',
      security: [{ bearerAuth: [] }],
      params: z.object({
        boardId: z.string().uuid(),
        cardId: z.string().uuid(),
      }),
      response: {
        204: z.null(),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { boardId, cardId } = request.params;
      const userName = await resolveUserName(userId);

      try {
        const cardsRepository = new PrismaCardsRepository();
        const card = await cardsRepository.findById(cardId, boardId);

        const useCase = makeDeleteCardUseCase();
        await useCase.execute({
          tenantId,
          userId,
          userName,
          boardId,
          cardId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.TASKS.CARD_DELETE,
          entityId: cardId,
          placeholders: { userName, cardTitle: card?.title ?? cardId },
        });

        return reply.status(204).send(null);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
