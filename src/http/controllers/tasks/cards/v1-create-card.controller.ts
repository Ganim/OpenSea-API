import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { resolveUserName } from '@/http/helpers/resolve-user-name';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { cardResponseSchema, createCardSchema } from '@/http/schemas/tasks';
import { makeCreateCardUseCase } from '@/use-cases/tasks/cards/factories/make-create-card-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function createCardController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/tasks/boards/:boardId/cards',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.TASK_CARDS.REGISTER,
        resource: 'task-cards',
      }),
    ],
    schema: {
      tags: ['Tasks - Cards'],
      summary: 'Create a new card',
      security: [{ bearerAuth: [] }],
      params: z.object({ boardId: z.string().uuid() }),
      body: createCardSchema,
      response: {
        201: z.object({ card: cardResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { boardId } = request.params;
      const userName = await resolveUserName(userId);

      try {
        const useCase = makeCreateCardUseCase();
        const result = await useCase.execute({
          tenantId,
          userId,
          userName,
          boardId,
          ...request.body,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.TASKS.CARD_CREATE,
          entityId: result.card.id,
          placeholders: { userName, cardTitle: result.card.title },
          newData: request.body,
        });

        return reply.status(201).send(result);
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
