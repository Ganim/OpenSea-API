import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { logAudit } from '@/http/helpers/audit.helper';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeAddRequestCommentUseCase } from '@/use-cases/requests/factories/make-add-request-comment-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function addRequestCommentController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/requests/:id/comments',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Core - Requests'],
      summary: 'Add a comment to a request',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: z.object({
        content: z.string().min(1),
        isInternal: z.boolean().optional(),
      }),
      response: {
        201: z.object({
          id: z.string(),
          content: z.string(),
          createdAt: z.string(),
        }),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const { user } = await getUserByIdUseCase.execute({ userId });
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const useCase = makeAddRequestCommentUseCase();

      const { comment } = await useCase.execute({
        requestId: request.params.id,
        authorId: userId,
        content: request.body.content,
        isInternal: request.body.isInternal,
        hasViewAllPermission: false, // Business logic checks if user can view request
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.REQUESTS.REQUEST_COMMENT_ADD,
        entityId: comment.id.toString(),
        placeholders: {
          userName,
          requestNumber: request.params.id,
        },
        newData: {
          content: request.body.content,
          isInternal: request.body.isInternal,
        },
      });

      return reply.status(201).send({
        id: comment.id.toString(),
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
      });
    },
  });
}
