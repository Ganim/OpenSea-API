import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { makeDeleteCustomerUseCase } from '@/use-cases/sales/customers/factories/make-delete-customer-use-case';

const paramsSchema = z.object({
  id: z.uuid(),
});

const responseSchema = z.object({
  message: z.string(),
});

export async function v1DeleteCustomerController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = paramsSchema.parse(request.params);

  try {
    const useCase = makeDeleteCustomerUseCase();

    const result = await useCase.execute({ id });

    return reply.status(200).send(result);
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: error.message });
    }

    throw error;
  }
}

v1DeleteCustomerController.schema = {
  tags: ['Customers'],
  summary: 'Delete customer (soft delete)',
  security: [{ bearerAuth: [] }],
  params: paramsSchema,
  response: {
    200: responseSchema,
    404: z.object({
      message: z.string(),
    }),
  },
};
