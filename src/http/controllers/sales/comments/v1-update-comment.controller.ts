import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { logAudit } from '@/http/helpers/audit.helper';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import {
  commentResponseSchema,
  updateCommentSchema,
} from '@/http/schemas/sales.schema';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeGetCommentByIdUseCase } from '@/use-cases/sales/comments/factories/make-get-comment-by-id-use-case';
import { makeUpdateCommentUseCase } from '@/use-cases/sales/comments/factories/make-update-comment-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function updateCommentController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/comments/:id',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Sales - Comments'],
      summary: 'Update a comment',
      params: z.object({ id: z.string().uuid() }),
      body: updateCommentSchema,
      response: {
        200: z.object({ comment: commentResponseSchema }),
        400: z.object({ message: z.string() }),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const { sub: userId } = request.user;
      const data = request.body;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const getCommentByIdUseCase = makeGetCommentByIdUseCase();

        const [{ user }, { comment: oldComment }] = await Promise.all([
          getUserByIdUseCase.execute({ userId }),
          getCommentByIdUseCase.execute({ id }),
        ]);
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const useCase = makeUpdateCommentUseCase();
        const { comment } = await useCase.execute({
          id,
          ...data,
          authorId: userId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.COMMENT_UPDATE,
          entityId: id,
          placeholders: {
            userName,
            orderNumber: comment.entityId || 'N/A',
          },
          oldData: { content: oldComment.content },
          newData: { content: data.content },
        });

        return reply.status(200).send({ comment });
      } catch (err) {
        if (err instanceof BadRequestError) {
          return reply.status(400).send({ message: err.message });
        }
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
