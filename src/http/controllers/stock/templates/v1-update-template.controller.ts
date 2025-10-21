import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { makeUpdateTemplateUseCase } from '@/use-cases/stock/templates/factories/make-update-template-use-case';
import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

const bodySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  productAttributes: z.record(z.string(), z.unknown()).optional(),
  variantAttributes: z.record(z.string(), z.unknown()).optional(),
  itemAttributes: z.record(z.string(), z.unknown()).optional(),
});

export async function v1UpdateTemplateController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const body = bodySchema.parse(request.body);

  const trimmedName = body.name?.trim();

  try {
    const updateTemplateUseCase = makeUpdateTemplateUseCase();

    const { template } = await updateTemplateUseCase.execute({
      id,
      name: trimmedName,
      productAttributes: body.productAttributes,
      variantAttributes: body.variantAttributes,
      itemAttributes: body.itemAttributes,
    });

    return reply.status(200).send({ template });
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

v1UpdateTemplateController.schema = {
  tags: ['Templates'],
  summary: 'Update an existing template',
  security: [{ bearerAuth: [] }],
  response: {
    200: z.object({
      template: z.object({
        id: z.string().uuid(),
        name: z.string(),
        productAttributes: z.record(z.string(), z.unknown()).nullable(),
        variantAttributes: z.record(z.string(), z.unknown()).nullable(),
        itemAttributes: z.record(z.string(), z.unknown()).nullable(),
        createdAt: z.date(),
        updatedAt: z.date().optional(),
      }),
    }),
  },
};
