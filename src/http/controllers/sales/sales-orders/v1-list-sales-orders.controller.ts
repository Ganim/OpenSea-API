import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { makeListSalesOrdersUseCase } from '@/use-cases/sales/sales-orders/factories/make-list-sales-orders-use-case';

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(20),
  customerId: z.string().optional(), // Removed .uuid() - returns empty array for non-existent
  status: z
    .enum([
      'DRAFT',
      'PENDING',
      'CONFIRMED',
      'IN_TRANSIT',
      'DELIVERED',
      'CANCELLED',
      'RETURNED',
    ])
    .optional(),
});

const responseSchema = z.object({
  orders: z.array(
    z.object({
      id: z.string(),
      orderNumber: z.string(),
      status: z.string(),
      customerId: z.string(),
      createdBy: z.string().nullable(),
      totalPrice: z.number(),
      discount: z.number(),
      finalPrice: z.number(),
      notes: z.string().nullable(),
      itemsCount: z.number(),
      createdAt: z.date(),
      updatedAt: z.date(),
    }),
  ),
  total: z.number(),
  page: z.number(),
  perPage: z.number(),
  totalPages: z.number(),
});

export async function v1ListSalesOrdersController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const query = querySchema.parse(request.query);

  const useCase = makeListSalesOrdersUseCase();

  const result = await useCase.execute(query);

  return reply.status(200).send(result);
}

v1ListSalesOrdersController.schema = {
  tags: ['Sales Orders'],
  summary: 'List sales orders with pagination',
  security: [{ bearerAuth: [] }],
  querystring: querySchema,
  response: {
    200: responseSchema,
  },
};
