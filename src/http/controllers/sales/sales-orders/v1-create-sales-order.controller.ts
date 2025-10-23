import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { makeCreateSalesOrderUseCase } from '@/use-cases/sales/sales-orders/factories/make-create-sales-order-use-case';

const bodySchema = z.object({
  orderNumber: z.string(),
  customerId: z.string(), // Removed .uuid() validation - let use case handle existence check
  createdBy: z.string().optional(),
  status: z.enum(['DRAFT', 'PENDING', 'CONFIRMED']).optional(),
  discount: z.number().min(0).optional(),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      variantId: z.string(), // Removed .uuid() validation - let use case handle existence check
      quantity: z.number().int().positive(),
      unitPrice: z.number().positive(),
      discount: z.number().min(0).optional(),
      notes: z.string().optional(),
    }),
  ),
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

export async function v1CreateSalesOrderController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = bodySchema.parse(request.body);

  try {
    const useCase = makeCreateSalesOrderUseCase();

    const result = await useCase.execute(body);

    return reply.status(201).send(result);
  } catch (error) {
    if (error instanceof BadRequestError) {
      return reply.status(400).send({ message: error.message });
    }
    if (error instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: error.message });
    }

    throw error;
  }
}

v1CreateSalesOrderController.schema = {
  tags: ['Sales Orders'],
  summary: 'Create a new sales order',
  security: [{ bearerAuth: [] }],
  body: bodySchema,
  response: {
    201: responseSchema,
    400: z.object({
      message: z.string(),
    }),
    404: z.object({
      message: z.string(),
    }),
  },
};
