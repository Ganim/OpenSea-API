import { makeListTagsUseCase } from '@/use-cases/stock/tags/factories/make-list-tags-use-case';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

const responseSchema = z.object({
  tags: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      slug: z.string(),
      color: z.string().nullable(),
      description: z.string().nullable(),
      createdAt: z.date(),
      updatedAt: z.date(),
    }),
  ),
});

export async function v1ListTagsController(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  const listTagsUseCase = makeListTagsUseCase();

  const { tags } = await listTagsUseCase.execute();

  return reply.status(200).send({ tags });
}

v1ListTagsController.schema = {
  summary: 'List all tags',
  tags: ['Tags'],
  response: {
    200: responseSchema,
  },
};
