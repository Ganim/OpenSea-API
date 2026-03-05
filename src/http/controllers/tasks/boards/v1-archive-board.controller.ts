import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { boardResponseSchema } from '@/http/schemas/tasks';
import { makeArchiveBoardUseCase } from '@/use-cases/tasks/boards/factories/make-archive-board-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function archiveBoardController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/tasks/boards/:boardId/archive',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TASKS.BOARDS.UPDATE,
        resource: 'task-boards',
      }),
    ],
    schema: {
      tags: ['Tasks - Boards'],
      summary: 'Archive or unarchive a board',
      security: [{ bearerAuth: [] }],
      params: z.object({ boardId: z.string().uuid() }),
      body: z.object({ archive: z.boolean().optional().default(true) }),
      response: {
        200: z.object({ board: boardResponseSchema }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { boardId } = request.params;

      try {
        const useCase = makeArchiveBoardUseCase();
        const result = await useCase.execute({
          tenantId,
          userId,
          boardId,
          archive: request.body.archive,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.TASKS.BOARD_ARCHIVE,
          entityId: boardId,
          placeholders: { userName: 'System', boardTitle: result.board.title },
        });

        return reply.status(200).send(result);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
