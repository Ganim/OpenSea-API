import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { makeCreateTagUseCase } from '@/use-cases/stock/tags/factories/make-create-tag-use-case';

const bodySchema = z.object({
  name: z.string().max(100),
  slug: z.string().max(100).optional(),
  color: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
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

async function v1CreateTagController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { name, slug, color, description } = bodySchema.parse(request.body);

  try {
    const createTagUseCase = makeCreateTagUseCase();

    const { tag } = await createTagUseCase.execute({
      name,
      slug,
      color,
      description,
    });

    return reply.status(201).send({ tag });
  } catch (error) {
    if (error instanceof BadRequestError) {
      return reply.status(400).send({ message: error.message });
    }

    throw error;
  }
}

v1CreateTagController.schema = {
  tags: ['Tags'],
  summary: 'Create a new tag',
  description:
    'Create a new product tag with name, slug, color, and description',
  body: bodySchema,
  response: {
    201: responseSchema,
  },
};

export { v1CreateTagController };
