import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { resolveUserName } from '@/http/helpers/resolve-user-name';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { boardResponseSchema, updateBoardSchema } from '@/http/schemas/tasks';
import { makeUpdateBoardUseCase } from '@/use-cases/tasks/boards/factories/make-update-board-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function updateBoardController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/tasks/boards/:boardId',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.TASK_BOARDS.MODIFY,
        resource: 'task-boards',
      }),
    ],
    schema: {
      tags: ['Tasks - Boards'],
      summary: 'Update a board',
      security: [{ bearerAuth: [] }],
      params: z.object({ boardId: z.string().uuid() }),
      body: updateBoardSchema,
      response: {
        200: z.object({ board: boardResponseSchema }),
        400: z.object({ message: z.string() }),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { boardId } = request.params;
      const userName = await resolveUserName(userId);

      try {
        const useCase = makeUpdateBoardUseCase();
        const result = await useCase.execute({
          tenantId,
          userId,
          boardId,
          ...request.body,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.TASKS.BOARD_UPDATE,
          entityId: boardId,
          placeholders: { userName, boardTitle: result.board.title },
          newData: request.body,
        });

        return reply.status(200).send(result);
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
