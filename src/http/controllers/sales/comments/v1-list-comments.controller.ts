import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { commentResponseSchema } from '@/http/schemas/sales.schema';
import { makeListCommentsUseCase } from '@/use-cases/sales/comments/factories/make-list-comments-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listCommentsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/comments',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Sales - Comments'],
      summary: 'List comments',
      querystring: z.object({
        entityType: z.string().optional(),
        entityId: z.string().uuid().optional(),
        authorId: z.string().uuid().optional(),
      }),
      response: {
        200: z.object({
          comments: z.array(commentResponseSchema),
        }),
      },
    },
    handler: async (request, reply) => {
      const { entityType, entityId, authorId } = request.query as {
        entityType?: string;
        entityId?: string;
        authorId?: string;
      };

      const useCase = makeListCommentsUseCase();
      const { comments } = await useCase.execute({
        entityType,
        entityId,
        authorId,
      });

      return reply.status(200).send({ comments });
    },
  });
}
