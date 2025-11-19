import { verifyJwt } from '@/http/middlewares/verify-jwt';
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
      tags: ['Requests'],
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
      const useCase = makeAddRequestCommentUseCase();

      const { comment } = await useCase.execute({
        requestId: request.params.id,
        authorId: request.user.sub,
        content: request.body.content,
        isInternal: request.body.isInternal,
        userRole: request.user.role,
      });

      return reply.status(201).send({
        id: comment.id.toString(),
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
      });
    },
  });
}
