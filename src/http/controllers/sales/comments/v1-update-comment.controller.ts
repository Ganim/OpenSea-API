import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { makeUpdateCommentUseCase } from '@/use-cases/sales/comments/factories/make-update-comment-use-case';

const paramsSchema = z.object({
  id: z.uuid(),
});

const bodySchema = z.object({
  content: z.string().min(1).max(5000),
});

const responseSchema = z.object({
  comment: z.object({
    id: z.string(),
    entityType: z.string(),
    entityId: z.string(),
    userId: z.string(),
    content: z.string(),
    parentCommentId: z.string().optional(),
    isDeleted: z.boolean(),
    isEdited: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date().optional(),
    deletedAt: z.date().optional(),
  }),
});

export async function v1UpdateCommentController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = paramsSchema.parse(request.params);
  const body = bodySchema.parse(request.body);
  const { sub: userId } = request.user;

  try {
    const useCase = makeUpdateCommentUseCase();

    const result = await useCase.execute({
      id,
      authorId: userId,
      ...body,
    });

    return reply.status(200).send(result);
  } catch (error) {
    if (error instanceof BadRequestError) {
      return reply.status(400).send({ message: error.message });
    }

    if (error instanceof ForbiddenError) {
      return reply.status(403).send({ message: error.message });
    }

    if (error instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: error.message });
    }

    throw error;
  }
}

v1UpdateCommentController.schema = {
  tags: ['Comments'],
  summary: 'Update comment',
  description: 'Update a comment (only by the author)',
  security: [{ bearerAuth: [] }],
  params: paramsSchema,
  body: bodySchema,
  response: {
    200: responseSchema,
    400: z.object({
      message: z.string(),
    }),
    403: z.object({
      message: z.string(),
    }),
    404: z.object({
      message: z.string(),
    }),
  },
};
