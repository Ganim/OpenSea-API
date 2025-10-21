import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { makeGetTagByIdUseCase } from '@/use-cases/stock/tags/factories/make-get-tag-by-id-use-case';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const responseSchema = z.object({
  tag: z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
    color: z.string().nullable(),
    description: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
});

export async function v1GetTagByIdController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = paramsSchema.parse(request.params);

  const getTagByIdUseCase = makeGetTagByIdUseCase();

  try {
    const { tag } = await getTagByIdUseCase.execute({ id });

    return reply.status(200).send({ tag });
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: error.message });
    }

    throw error;
  }
}

v1GetTagByIdController.schema = {
  summary: 'Get tag by ID',
  tags: ['Tags'],
  params: paramsSchema,
  response: {
    200: responseSchema,
  },
};
