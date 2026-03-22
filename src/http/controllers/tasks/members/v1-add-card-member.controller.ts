import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { resolveUserName } from '@/http/helpers/resolve-user-name';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  addCardMemberSchema,
  cardMemberResponseSchema,
} from '@/http/schemas/tasks/card-member.schema';
import { makeAddCardMemberUseCase } from '@/use-cases/tasks/members/factories/make-add-card-member-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function addCardMemberController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/tasks/boards/:boardId/cards/:cardId/members',
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
      summary: 'Add a member to a card',
      security: [{ bearerAuth: [] }],
      params: z.object({
        boardId: z.string().uuid(),
        cardId: z.string().uuid(),
      }),
      body: addCardMemberSchema,
      response: {
        201: z.object({ member: cardMemberResponseSchema }),
        400: z.object({ message: z.string() }),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { boardId, cardId } = request.params;
      const { userId: memberId } = request.body;

      const userName = await resolveUserName(userId);

      try {
        const useCase = makeAddCardMemberUseCase();
        const result = await useCase.execute({
          tenantId,
          userId,
          userName,
          boardId,
          cardId,
          memberId,
        });

        return reply.status(201).send({
          member: {
            id: result.member.id,
            cardId: result.member.cardId,
            userId: result.member.userId,
            userName: null,
            userEmail: null,
            addedAt: result.member.createdAt,
          },
        });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
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
