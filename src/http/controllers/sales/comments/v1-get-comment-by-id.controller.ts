import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { commentResponseSchema } from '@/http/schemas/sales.schema';
import { makeGetCommentByIdUseCase } from '@/use-cases/sales/comments/factories/make-get-comment-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getCommentByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/comments/:id',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Comments'],
      summary: 'Get comment by ID',
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({ comment: commentResponseSchema }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const useCase = makeGetCommentByIdUseCase();
        const { comment } = await useCase.execute({ id });

        return reply.status(200).send({ comment });
      } catch (err) {
        if (err instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
