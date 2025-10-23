import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { makeDeleteVariantPromotionUseCase } from '@/use-cases/sales/variant-promotions/factories/make-delete-variant-promotion-use-case';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export async function v1DeleteVariantPromotionController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = paramsSchema.parse(request.params);

  try {
    const deleteVariantPromotionUseCase = makeDeleteVariantPromotionUseCase();

    await deleteVariantPromotionUseCase.execute({ id });

    return reply.status(204).send();
  } catch (err) {
    if (err instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: err.message });
    }

    throw err;
  }
}

v1DeleteVariantPromotionController.schema = {
  tags: ['Variant Promotions'],
  summary: 'Delete variant promotion',
  description: 'Soft delete a variant promotion',
  security: [{ bearerAuth: [] }],
  params: paramsSchema,
  response: {
    204: z.null().describe('No content'),
    404: z.object({
      message: z.string(),
    }),
  },
};
