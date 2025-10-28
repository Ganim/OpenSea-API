import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { makeGetSalesOrderByIdUseCase } from '@/use-cases/sales/sales-orders/factories/make-get-sales-order-by-id-use-case';

const paramsSchema = z.object({
  id: z.uuid(),
});

const responseSchema = z.object({
  salesOrder: z.object({
    id: z.string(),
    orderNumber: z.string(),
    status: z.string(),
    customerId: z.string(),
    createdBy: z.string().nullable(),
    totalPrice: z.number(),
    discount: z.number(),
    finalPrice: z.number(),
    notes: z.string().nullable(),
    items: z.array(
      z.object({
        id: z.string(),
        variantId: z.string(),
        quantity: z.number(),
        unitPrice: z.number(),
        discount: z.number(),
        totalPrice: z.number(),
        notes: z.string().nullable(),
      }),
    ),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
});

export async function v1GetSalesOrderByIdController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = paramsSchema.parse(request.params);

  try {
    const useCase = makeGetSalesOrderByIdUseCase();

    const result = await useCase.execute({ id });

    return reply.status(200).send(result);
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: error.message });
    }

    throw error;
  }
}

v1GetSalesOrderByIdController.schema = {
  tags: ['Sales Orders'],
  summary: 'Get sales order by ID',
  security: [{ bearerAuth: [] }],
  params: paramsSchema,
  response: {
    200: responseSchema,
    404: z.object({
      message: z.string(),
    }),
  },
};
