import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { resolveUserName } from '@/http/helpers/resolve-user-name';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { assignCardSchema, cardResponseSchema } from '@/http/schemas/tasks';
import { makeAssignCardUseCase } from '@/use-cases/tasks/cards/factories/make-assign-card-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function assignCardController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/tasks/boards/:boardId/cards/:cardId/assign',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.TASK_CARDS.ADMIN,
        resource: 'task-cards',
      }),
    ],
    schema: {
      tags: ['Tasks - Cards'],
      summary: 'Assign or unassign a card',
      security: [{ bearerAuth: [] }],
      params: z.object({
        boardId: z.string().uuid(),
        cardId: z.string().uuid(),
      }),
      body: assignCardSchema,
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
      const userName = await resolveUserName(userId);

      try {
        const useCase = makeAssignCardUseCase();
        const result = await useCase.execute({
          tenantId,
          userId,
          userName,
          boardId,
          cardId,
          assigneeId: request.body.assigneeId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.TASKS.CARD_ASSIGN,
          entityId: cardId,
          placeholders: { userName, cardTitle: result.card.title },
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
