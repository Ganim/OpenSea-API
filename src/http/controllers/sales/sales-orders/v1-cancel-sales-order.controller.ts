import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { makeCancelSalesOrderUseCase } from '@/use-cases/sales/sales-orders/factories/make-cancel-sales-order-use-case';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const responseSchema = z.object({
  message: z.string(),
});

export async function v1CancelSalesOrderController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = paramsSchema.parse(request.params);

  try {
    const useCase = makeCancelSalesOrderUseCase();

    const result = await useCase.execute({ id });

    return reply.status(200).send(result);
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

v1CancelSalesOrderController.schema = {
  tags: ['Sales Orders'],
  summary: 'Cancel sales order',
  security: [{ bearerAuth: [] }],
  params: paramsSchema,
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
