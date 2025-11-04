import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { makeDeleteCommentUseCase } from '@/use-cases/sales/comments/factories/make-delete-comment-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function deleteCommentController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/comments/:id',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Comments'],
      summary: 'Delete a comment (soft delete)',
      params: z.object({ id: z.string().uuid() }),
      response: {
        204: z.void(),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const { sub: userId } = request.user;
        const useCase = makeDeleteCommentUseCase();
        await useCase.execute({
          id,
          authorId: userId,
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
