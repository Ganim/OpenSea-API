import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { NotFoundError } from '@/@errors/use-cases/not-found-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  boardMemberResponseSchema,
  updateBoardMemberSchema,
} from '@/http/schemas/tasks';
import { makeUpdateBoardMemberUseCase } from '@/use-cases/tasks/boards/factories/make-update-board-member-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function updateBoardMemberController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/tasks/boards/:boardId/members/:memberId',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TASKS.BOARDS.MANAGE,
        resource: 'task-boards',
      }),
    ],
    schema: {
      tags: ['Tasks - Boards'],
      summary: 'Update a board member role',
      security: [{ bearerAuth: [] }],
      params: z.object({
        boardId: z.string().uuid(),
        memberId: z.string().uuid(),
      }),
      body: updateBoardMemberSchema,
      response: {
        200: z.object({ member: boardMemberResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { boardId, memberId } = request.params;

      try {
        const useCase = makeUpdateBoardMemberUseCase();
        const result = await useCase.execute({
          tenantId,
          userId,
          boardId,
          targetUserId: memberId,
          role: request.body.role,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.TASKS.MEMBER_UPDATE,
          entityId: memberId,
          placeholders: { userName: 'System', boardTitle: boardId },
          newData: request.body,
        });

        return reply.status(200).send(result);
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof NotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
