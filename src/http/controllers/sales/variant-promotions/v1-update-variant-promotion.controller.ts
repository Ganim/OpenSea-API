import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { makeUpdateVariantPromotionUseCase } from '@/use-cases/sales/variant-promotions/factories/make-update-variant-promotion-use-case';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const bodySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  discountValue: z.number().nonnegative().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
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

export async function v1UpdateVariantPromotionController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = paramsSchema.parse(request.params);
  const { name, discountValue, startDate, endDate, isActive, notes } =
    bodySchema.parse(request.body);

  try {
    const updateVariantPromotionUseCase = makeUpdateVariantPromotionUseCase();

    const result = await updateVariantPromotionUseCase.execute({
      id,
      name,
      discountValue,
      startDate,
      endDate,
      isActive,
      notes,
    });

    return reply.status(200).send(result);
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

v1UpdateVariantPromotionController.schema = {
  tags: ['Variant Promotions'],
  summary: 'Update variant promotion',
  description: 'Update an existing variant promotion',
  security: [{ bearerAuth: [] }],
  params: paramsSchema,
  body: bodySchema,
  response: {
    200: responseSchema,
    400: z.object({
      message: z.string(),
    }),
    404: z.object({
      message: z.string(),
    }),
  },
};
