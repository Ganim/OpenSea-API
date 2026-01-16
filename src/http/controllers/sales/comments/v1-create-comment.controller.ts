import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { logAudit } from '@/http/helpers/audit.helper';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import {
  commentResponseSchema,
  createCommentSchema,
} from '@/http/schemas/sales.schema';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeCreateCommentUseCase } from '@/use-cases/sales/comments/factories/make-create-comment-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function createCommentController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/comments',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Sales - Comments'],
      summary: 'Create a new comment',
      body: createCommentSchema,
      response: {
        201: z.object({ comment: commentResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const { sub: userId } = request.user;
      const data = request.body;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user } = await getUserByIdUseCase.execute({ userId });
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const useCase = makeCreateCommentUseCase();
        const { comment } = await useCase.execute({
          ...data,
          authorId: userId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.COMMENT_CREATE,
          entityId: comment.id,
          placeholders: {
            userName,
            orderNumber: data.entityId || 'N/A',
          },
          newData: {
            content: data.content,
            entityId: data.entityId,
            entityType: data.entityType,
          },
        });

        return reply.status(201).send({ comment });
      } catch (err) {
        if (err instanceof BadRequestError) {
          return reply.status(400).send({ message: err.message });
        }
        if (err instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
