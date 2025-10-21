import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { makeListLocationsUseCase } from '@/use-cases/stock/locations/factories/make-list-locations-use-case';

const responseSchema = z.object({
  locations: z.array(
    z.object({
      id: z.string().uuid(),
      code: z.string(),
      description: z.string().optional(),
      locationType: z.string().optional(),
      parentId: z.string().uuid().optional(),
      capacity: z.number().int().min(0).optional(),
      currentOccupancy: z.number().int().min(0),
      isActive: z.boolean(),
    }),
  ),
});

async function v1ListLocationsController(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  const listLocationsUseCase = makeListLocationsUseCase();

  const { locations } = await listLocationsUseCase.execute();

  return reply.status(200).send({ locations });
}

v1ListLocationsController.schema = {
  tags: ['Locations'],
  summary: 'List all active locations',
  description: 'List all active storage locations',
  response: {
    200: responseSchema,
  },
};

export { v1ListLocationsController };
