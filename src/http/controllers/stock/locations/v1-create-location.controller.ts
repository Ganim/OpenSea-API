import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { makeCreateLocationUseCase } from '@/use-cases/stock/locations/factories/make-create-location-use-case';

const bodySchema = z.object({
  code: z.string(),
  description: z.string().optional(),
  locationType: z
    .enum(['WAREHOUSE', 'ZONE', 'AISLE', 'SHELF', 'BIN', 'OTHER'])
    .optional(),
  parentId: z.string().uuid().optional(),
  capacity: z.number().int().nonnegative().optional(),
  currentOccupancy: z.number().int().nonnegative().optional(),
});

const responseSchema = z.object({
  location: z.object({
    id: z.string(),
    code: z.string(),
    description: z.string().optional(),
    locationType: z.string().optional(),
    parentId: z.string().optional(),
    capacity: z.number().optional(),
    currentOccupancy: z.number(),
    isActive: z.boolean(),
  }),
});

export async function v1CreateLocationController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = bodySchema.parse(request.body);

  try {
    const useCase = makeCreateLocationUseCase();

    const result = await useCase.execute(body);

    return reply.status(201).send(result);
  } catch (error) {
    if (error instanceof BadRequestError) {
      return reply.status(400).send({ message: error.message });
    }

    throw error;
  }
}

v1CreateLocationController.schema = {
  tags: ['Locations'],
  summary: 'Create a new location',
  security: [{ bearerAuth: [] }],
  body: bodySchema,
  response: {
    201: responseSchema,
    400: z.object({
      message: z.string(),
    }),
  },
};
