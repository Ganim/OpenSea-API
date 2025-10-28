import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { makeCreateCommentUseCase } from '@/use-cases/sales/comments/factories/make-create-comment-use-case';

const bodySchema = z.object({
  entityType: z.enum(['CUSTOMER', 'PRODUCT', 'SALES_ORDER']),
  entityId: z.uuid(),
  content: z.string().min(1).max(5000),
  parentCommentId: z.uuid().optional(),
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

export async function v1CreateCommentController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = bodySchema.parse(request.body);
  const { sub: userId } = request.user;

  try {
    const useCase = makeCreateCommentUseCase();

    const result = await useCase.execute({
      ...body,
      authorId: userId,
    });

    return reply.status(201).send(result);
  } catch (error) {
    if (error instanceof BadRequestError) {
      return reply.status(400).send({ message: error.message });
    }

    if (error instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: error.message });
    }

    throw error;
  }
}

v1CreateCommentController.schema = {
  tags: ['Comments'],
  summary: 'Create a new comment',
  description: 'Create a comment for a customer, product, or sales order',
  security: [{ bearerAuth: [] }],
  body: bodySchema,
  response: {
    201: responseSchema,
    400: z.object({
      message: z.string(),
    }),
    404: z.object({
      message: z.string(),
    }),
  },
};
