import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { makeGetLocationByIdUseCase } from '@/use-cases/stock/locations/factories/make-get-location-by-id-use-case';

const paramsSchema = z.object({
  id: z.string().uuid(),
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

async function v1GetLocationByIdController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = paramsSchema.parse(request.params);

  try {
    const getLocationByIdUseCase = makeGetLocationByIdUseCase();

    const { location } = await getLocationByIdUseCase.execute({ id });

    return reply.status(200).send({ location });
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: error.message });
    }

    throw error;
  }
}

v1GetLocationByIdController.schema = {
  tags: ['Locations'],
  summary: 'Get location by ID',
  description: 'Get location details by ID',
  params: paramsSchema,
  response: {
    200: responseSchema,
  },
};

export { v1GetLocationByIdController };
