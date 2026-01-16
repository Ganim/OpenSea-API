import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { logAudit } from '@/http/helpers/audit.helper';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeDeleteCommentUseCase } from '@/use-cases/sales/comments/factories/make-delete-comment-use-case';
import { makeGetCommentByIdUseCase } from '@/use-cases/sales/comments/factories/make-get-comment-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function deleteCommentController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/comments/:id',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Sales - Comments'],
      summary: 'Delete a comment (soft delete)',
      params: z.object({ id: z.string().uuid() }),
      response: {
        204: z.void(),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const { sub: userId } = request.user;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const getCommentByIdUseCase = makeGetCommentByIdUseCase();

        const [{ user }, { comment }] = await Promise.all([
          getUserByIdUseCase.execute({ userId }),
          getCommentByIdUseCase.execute({ id }),
        ]);
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const useCase = makeDeleteCommentUseCase();
        await useCase.execute({
          id,
          authorId: userId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.COMMENT_DELETE,
          entityId: id,
          placeholders: {
            userName,
            orderNumber: comment.entityId || 'N/A',
          },
          oldData: { content: comment.content },
        });

        return reply.status(204).send();
      } catch (err) {
        if (err instanceof ForbiddenError) {
          return reply.status(403).send({ message: err.message });
        }
        if (err instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
