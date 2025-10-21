import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { makeCreateTemplateUseCase } from '@/use-cases/stock/templates/factories/make-create-template-use-case';
import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

const bodySchema = z.object({
  name: z.string().min(1).max(200),
  productAttributes: z.record(z.string(), z.unknown()).optional(),
  variantAttributes: z.record(z.string(), z.unknown()).optional(),
  itemAttributes: z.record(z.string(), z.unknown()).optional(),
});

export async function v1CreateTemplateController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { name, productAttributes, variantAttributes, itemAttributes } =
    bodySchema.parse(request.body);

  try {
    const createTemplateUseCase = makeCreateTemplateUseCase();

    const { template } = await createTemplateUseCase.execute({
      name: name.trim(),
      productAttributes: productAttributes || undefined,
      variantAttributes: variantAttributes || undefined,
      itemAttributes: itemAttributes || undefined,
    });

    return reply.status(201).send({
      template,
    });
  } catch (error) {
    if (error instanceof BadRequestError) {
      return reply.status(400).send({
        message: error.message,
      });
    }

    throw error;
  }
}

v1CreateTemplateController.schema = {
  tags: ['stock/templates'],
  summary: 'Create a new template',
  description:
    'Creates a new template with product, variant, and item attributes',
};
