import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { makeUpdateTagUseCase } from '@/use-cases/stock/tags/factories/make-update-tag-use-case';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const bodySchema = z.object({
  name: z.string().max(100).optional(),
  slug: z.string().max(100).optional(),
  color: z
    .string()
    .regex(
      /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
      'Color must be a valid hex color code (e.g., #FF5733 or #FFF)',
    )
    .optional(),
  description: z.string().optional(),
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

export async function v1UpdateTagController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = paramsSchema.parse(request.params);
  const { name, slug, color, description } = bodySchema.parse(request.body);

  const updateTagUseCase = makeUpdateTagUseCase();

  try {
    const { tag } = await updateTagUseCase.execute({
      id,
      name,
      slug,
      color,
      description,
    });

    return reply.status(200).send({ tag });
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: error.message });
    }

    if (error instanceof BadRequestError) {
      return reply.status(400).send({ message: error.message });
    }

    throw error;
  }
}

v1UpdateTagController.schema = {
  summary: 'Update tag',
  tags: ['Tags'],
  params: paramsSchema,
  body: bodySchema,
  response: {
    200: responseSchema,
  },
};
