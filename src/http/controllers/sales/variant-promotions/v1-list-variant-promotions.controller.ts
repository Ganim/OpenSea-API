import { makeListVariantPromotionsUseCase } from '@/use-cases/sales/variant-promotions/factories/make-list-variant-promotions-use-case';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

const querySchema = z.object({
  variantId: z.string().uuid().optional(),
  activeOnly: z.preprocess((val) => {
    if (val === undefined || val === null) return undefined;
    if (val === 'true') return true;
    if (val === 'false') return false;
    return val;
  }, z.boolean().optional()),
});

const responseSchema = z.object({
  promotions: z.array(
    z.object({
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
  ),
});

export async function v1ListVariantPromotionsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { variantId, activeOnly } = querySchema.parse(request.query);

  const listVariantPromotionsUseCase = makeListVariantPromotionsUseCase();

  const result = await listVariantPromotionsUseCase.execute({
    variantId,
    activeOnly,
  });

  return reply.status(200).send(result);
}

v1ListVariantPromotionsController.schema = {
  tags: ['Variant Promotions'],
  summary: 'List variant promotions',
  description: 'List variant promotions with optional filters',
  security: [{ bearerAuth: [] }],
  querystring: querySchema,
  response: {
    200: responseSchema,
  },
};
