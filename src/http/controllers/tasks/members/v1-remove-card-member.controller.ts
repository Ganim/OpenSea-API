import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { resolveUserName } from '@/http/helpers/resolve-user-name';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeRemoveCardMemberUseCase } from '@/use-cases/tasks/members/factories/make-remove-card-member-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function removeCardMemberController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/tasks/boards/:boardId/cards/:cardId/members/:userId',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.TASKS.CARDS.MODIFY,
        resource: 'task-members',
      }),
    ],
    schema: {
      tags: ['Tasks - Members'],
      summary: 'Remove a member from a card',
      security: [{ bearerAuth: [] }],
      params: z.object({
        boardId: z.string().uuid(),
        cardId: z.string().uuid(),
        userId: z.string().uuid(),
      }),
      response: {
        204: z.null(),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const currentUserId = request.user.sub;
      const { boardId, cardId, userId: memberId } = request.params;

      const userName = await resolveUserName(currentUserId);

      try {
        const useCase = makeRemoveCardMemberUseCase();
        await useCase.execute({
          tenantId,
          userId: currentUserId,
          userName,
          boardId,
          cardId,
          memberId,
        });

        return reply.status(204).send(null);
      } catch (error) {
        if (error instanceof ForbiddenError) {
          return reply.status(403).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
