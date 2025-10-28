import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { makeUpdateSalesOrderStatusUseCase } from '@/use-cases/sales/sales-orders/factories/make-update-sales-order-status-use-case';

const paramsSchema = z.object({
  id: z.uuid(),
});

const bodySchema = z.object({
  status: z.enum([
    'DRAFT',
    'PENDING',
    'CONFIRMED',
    'IN_TRANSIT',
    'DELIVERED',
    'CANCELLED',
    'RETURNED',
  ]),
});

const responseSchema = z.object({
  salesOrder: z.object({
    id: z.string(),
    orderNumber: z.string(),
    status: z.string(),
    customerId: z.string(),
    totalPrice: z.number(),
    discount: z.number(),
    finalPrice: z.number(),
    updatedAt: z.date(),
  }),
});

export async function v1UpdateSalesOrderStatusController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = paramsSchema.parse(request.params);
  const { status } = bodySchema.parse(request.body);

  try {
    const useCase = makeUpdateSalesOrderStatusUseCase();

    const result = await useCase.execute({ id, status });

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

v1UpdateSalesOrderStatusController.schema = {
  tags: ['Sales Orders'],
  summary: 'Update sales order status',
  security: [{ bearerAuth: [] }],
  params: paramsSchema,
  body: bodySchema,
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
