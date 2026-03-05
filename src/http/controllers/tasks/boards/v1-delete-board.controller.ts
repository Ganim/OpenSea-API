import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeDeleteBoardUseCase } from '@/use-cases/tasks/boards/factories/make-delete-board-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function deleteBoardController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/tasks/boards/:boardId',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TASKS.BOARDS.DELETE,
        resource: 'task-boards',
      }),
    ],
    schema: {
      tags: ['Tasks - Boards'],
      summary: 'Delete a board',
      security: [{ bearerAuth: [] }],
      params: z.object({ boardId: z.string().uuid() }),
      response: {
        204: z.null(),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { boardId } = request.params;

      try {
        const useCase = makeDeleteBoardUseCase();
        await useCase.execute({ tenantId, userId, boardId });

        await logAudit(request, {
          message: AUDIT_MESSAGES.TASKS.BOARD_DELETE,
          entityId: boardId,
          placeholders: { userName: 'System', boardTitle: boardId },
        });

        return reply.status(204).send();
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
