import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import {
    commentResponseSchema,
    updateCommentSchema,
} from '@/http/schemas/sales.schema';
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
      try {
        const { id } = request.params as { id: string };
        const { sub: userId } = request.user;
        const useCase = makeUpdateCommentUseCase();
        const { comment } = await useCase.execute({
          id,
          ...request.body,
          authorId: userId,
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
