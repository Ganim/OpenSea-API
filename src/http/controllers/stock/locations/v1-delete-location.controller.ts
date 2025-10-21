import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { makeDeleteLocationUseCase } from '@/use-cases/stock/locations/factories/make-delete-location-use-case';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

async function v1DeleteLocationController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = paramsSchema.parse(request.params);

  try {
    const deleteLocationUseCase = makeDeleteLocationUseCase();

    await deleteLocationUseCase.execute({ id });

    return reply.status(204).send();
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: error.message });
    }

    throw error;
  }
}

v1DeleteLocationController.schema = {
  tags: ['Locations'],
  summary: 'Delete location',
  description: 'Soft delete a location',
  params: paramsSchema,
};

export { v1DeleteLocationController };
