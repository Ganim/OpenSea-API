import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { makeDeleteSupplierUseCase } from '@/use-cases/stock/suppliers/factories/make-delete-supplier-use-case';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export async function v1DeleteSupplierController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = paramsSchema.parse(request.params);

  try {
    const useCase = makeDeleteSupplierUseCase();

    await useCase.execute({ id });

    return reply.status(204).send();
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: error.message });
    }

    throw error;
  }
}

v1DeleteSupplierController.schema = {
  tags: ['stock/suppliers'],
  summary: 'Delete a supplier',
  security: [{ bearerAuth: [] }],
  params: paramsSchema,
  response: {
    204: z.void(),
    404: z.object({
      message: z.string(),
    }),
  },
};
