import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { makeListCommentsUseCase } from '@/use-cases/sales/comments/factories/make-list-comments-use-case';

const querySchema = z.object({
  entityType: z.enum(['CUSTOMER', 'PRODUCT', 'SALES_ORDER']).optional(),
  entityId: z.uuid().optional(),
  authorId: z.uuid().optional(),
});

const responseSchema = z.object({
  comments: z.array(
    z.object({
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
  ),
});

export async function v1ListCommentsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const query = querySchema.parse(request.query);

  const useCase = makeListCommentsUseCase();

  const result = await useCase.execute(query);

  return reply.status(200).send(result);
}

v1ListCommentsController.schema = {
  tags: ['Comments'],
  summary: 'List comments',
  description: 'List comments filtered by entity or author',
  security: [{ bearerAuth: [] }],
  querystring: querySchema,
  response: {
    200: responseSchema,
  },
};
