import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { makeDeleteManufacturerUseCase } from '@/use-cases/stock/manufacturers/factories/make-delete-manufacturer-use-case';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export async function v1DeleteManufacturerController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = paramsSchema.parse(request.params);

  try {
    const useCase = makeDeleteManufacturerUseCase();

    await useCase.execute({ id });

    return reply.status(204).send();
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: error.message });
    }

    throw error;
  }
}

v1DeleteManufacturerController.schema = {
  tags: ['Manufacturers'],
  summary: 'Delete a manufacturer',
  security: [{ bearerAuth: [] }],
  params: paramsSchema,
  response: {
    204: z.void(),
    404: z.object({
      message: z.string(),
    }),
  },
};
