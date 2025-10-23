import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { makeGetVariantPromotionByIdUseCase } from '@/use-cases/sales/variant-promotions/factories/make-get-variant-promotion-by-id-use-case';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const responseSchema = z.object({
  promotion: z.object({
    id: z.string(),
    variantId: z.string(),
    name: z.string(),
    discountType: z.string(),
    discountValue: z.number(),
    startDate: z.date(),
    endDate: z.date(),
    isActive: z.boolean(),
    isCurrentlyValid: z.boolean(),
    isExpired: z.boolean(),
    isUpcoming: z.boolean(),
    notes: z.string().optional(),
    createdAt: z.date(),
    updatedAt: z.date().optional(),
  }),
});

export async function v1GetVariantPromotionByIdController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = paramsSchema.parse(request.params);

  try {
    const getVariantPromotionByIdUseCase = makeGetVariantPromotionByIdUseCase();

    const result = await getVariantPromotionByIdUseCase.execute({ id });

    return reply.status(200).send(result);
  } catch (err) {
    if (err instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: err.message });
    }

    throw err;
  }
}

v1GetVariantPromotionByIdController.schema = {
  tags: ['Variant Promotions'],
  summary: 'Get variant promotion by ID',
  description: 'Retrieve a specific variant promotion by its ID',
  security: [{ bearerAuth: [] }],
  params: paramsSchema,
  response: {
    200: responseSchema,
    404: z.object({
      message: z.string(),
    }),
  },
};
