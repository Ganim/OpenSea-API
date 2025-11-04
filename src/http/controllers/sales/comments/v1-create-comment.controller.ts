import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import {
  commentResponseSchema,
  createCommentSchema,
} from '@/http/schemas/sales.schema';
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
      tags: ['Comments'],
      summary: 'Create a new comment',
      body: createCommentSchema,
      response: {
        201: z.object({ comment: commentResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      try {
        const useCase = makeCreateCommentUseCase();
        const { sub: userId } = request.user;
        const { comment } = await useCase.execute({
          ...request.body,
          authorId: userId,
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
