import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { makeDeleteCommentUseCase } from '@/use-cases/sales/comments/factories/make-delete-comment-use-case';

const paramsSchema = z.object({
  id: z.uuid(),
});

export async function v1DeleteCommentController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = paramsSchema.parse(request.params);
  const { sub: userId } = request.user;

  try {
    const useCase = makeDeleteCommentUseCase();

    await useCase.execute({
      id,
      authorId: userId,
    });

    return reply.status(204).send();
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return reply.status(403).send({ message: error.message });
    }

    if (error instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: error.message });
    }

    throw error;
  }
}

v1DeleteCommentController.schema = {
  tags: ['Comments'],
  summary: 'Delete comment',
  description: 'Delete a comment (only by the author)',
  security: [{ bearerAuth: [] }],
  params: paramsSchema,
  response: {
    204: z.null(),
    403: z.object({
      message: z.string(),
    }),
    404: z.object({
      message: z.string(),
    }),
  },
};
