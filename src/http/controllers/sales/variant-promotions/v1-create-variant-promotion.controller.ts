import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { makeCreateVariantPromotionUseCase } from '@/use-cases/sales/variant-promotions/factories/make-create-variant-promotion-use-case';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

const bodySchema = z.object({
  variantId: z.uuid(),
  name: z.string().min(1).max(100),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
  discountValue: z.number().nonnegative(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  isActive: z.boolean().optional().default(true),
  notes: z.string().optional(),
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

export async function v1CreateVariantPromotionController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const {
    variantId,
    name,
    discountType,
    discountValue,
    startDate,
    endDate,
    isActive,
    notes,
  } = bodySchema.parse(request.body);

  try {
    const createVariantPromotionUseCase = makeCreateVariantPromotionUseCase();

    const result = await createVariantPromotionUseCase.execute({
      variantId,
      name,
      discountType,
      discountValue,
      startDate,
      endDate,
      isActive,
      notes,
    });

    return reply.status(201).send(result);
  } catch (err) {
    if (err instanceof BadRequestError) {
      return reply.status(400).send({ message: err.message });
    }

    if (err instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: err.message });
    }

    throw err;
  }
}

v1CreateVariantPromotionController.schema = {
  tags: ['Variant Promotions'],
  summary: 'Create a new variant promotion',
  description: 'Create a promotion for a product variant',
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
