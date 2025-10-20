import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { makeUpdateManufacturerUseCase } from '@/use-cases/stock/manufacturers/factories/make-update-manufacturer-use-case';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const bodySchema = z.object({
  name: z.string().optional(),
  country: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  rating: z.number().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

const responseSchema = z.object({
  manufacturer: z.object({
    id: z.string(),
    name: z.string(),
    country: z.string(),
    email: z.string().optional(),
    phone: z.string().optional(),
    website: z.string().optional(),
    addressLine1: z.string().optional(),
    addressLine2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    rating: z.number().optional(),
    notes: z.string().optional(),
    isActive: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
});

export async function v1UpdateManufacturerController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = paramsSchema.parse(request.params);
  const body = bodySchema.parse(request.body);

  try {
    const useCase = makeUpdateManufacturerUseCase();

    const result = await useCase.execute({
      id,
      ...body,
    });

    return reply.send(result);
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

v1UpdateManufacturerController.schema = {
  tags: ['stock/manufacturers'],
  summary: 'Update a manufacturer',
  security: [{ bearerAuth: [] }],
  params: paramsSchema,
  body: bodySchema,
  response: {
    200: responseSchema,
    404: z.object({
      message: z.string(),
    }),
    400: z.object({
      message: z.string(),
    }),
  },
};
