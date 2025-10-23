import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { makeGetCommentByIdUseCase } from '@/use-cases/sales/comments/factories/make-get-comment-by-id-use-case';

const paramsSchema = z.object({
  id: z.string().uuid(),
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

export async function v1GetCommentByIdController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = paramsSchema.parse(request.params);

  try {
    const useCase = makeGetCommentByIdUseCase();

    const result = await useCase.execute({ id });

    return reply.status(200).send(result);
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: error.message });
    }

    throw error;
  }
}

v1GetCommentByIdController.schema = {
  tags: ['Comments'],
  summary: 'Get comment by ID',
  description: 'Retrieve a comment by its ID',
  security: [{ bearerAuth: [] }],
  params: paramsSchema,
  response: {
    200: responseSchema,
    404: z.object({
      message: z.string(),
    }),
  },
};
