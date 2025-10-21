import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { makeUpdateLocationUseCase } from '@/use-cases/stock/locations/factories/make-update-location-use-case';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const bodySchema = z.object({
  code: z.string().max(50).optional(),
  description: z.string().optional(),
  locationType: z
    .enum(['WAREHOUSE', 'ZONE', 'AISLE', 'SHELF', 'BIN', 'OTHER'])
    .optional(),
  parentId: z.string().uuid().optional(),
  capacity: z.number().int().min(0).optional(),
  currentOccupancy: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

const responseSchema = z.object({
  location: z.object({
    id: z.string().uuid(),
    code: z.string(),
    description: z.string().optional(),
    locationType: z.string().optional(),
    parentId: z.string().uuid().optional(),
    capacity: z.number().int().min(0).optional(),
    currentOccupancy: z.number().int().min(0),
    isActive: z.boolean(),
  }),
});

async function v1UpdateLocationController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = paramsSchema.parse(request.params);
  const {
    code,
    description,
    locationType,
    parentId,
    capacity,
    currentOccupancy,
    isActive,
  } = bodySchema.parse(request.body);

  try {
    const updateLocationUseCase = makeUpdateLocationUseCase();

    const { location } = await updateLocationUseCase.execute({
      id,
      code,
      description,
      locationType,
      parentId,
      capacity,
      currentOccupancy,
      isActive,
    });

    return reply.status(200).send({ location });
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

v1UpdateLocationController.schema = {
  tags: ['Locations'],
  summary: 'Update location',
  description: 'Update location details',
  params: paramsSchema,
  body: bodySchema,
  response: {
    200: responseSchema,
  },
};

export { v1UpdateLocationController };
