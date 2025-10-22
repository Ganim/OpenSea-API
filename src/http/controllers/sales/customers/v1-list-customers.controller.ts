import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { makeListCustomersUseCase } from '@/use-cases/sales/customers/factories/make-list-customers-use-case';

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(20),
  type: z.enum(['INDIVIDUAL', 'BUSINESS']).optional(),
  isActive: z.coerce.boolean().optional(),
});

const responseSchema = z.object({
  customers: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      type: z.string(),
      document: z.string().nullable(),
      email: z.string().nullable(),
      phone: z.string().nullable(),
      address: z.string().nullable(),
      city: z.string().nullable(),
      state: z.string().nullable(),
      zipCode: z.string().nullable(),
      country: z.string().nullable(),
      notes: z.string().nullable(),
      isActive: z.boolean(),
      createdAt: z.date(),
      updatedAt: z.date(),
    }),
  ),
  total: z.number(),
  page: z.number(),
  perPage: z.number(),
  totalPages: z.number(),
});

export async function v1ListCustomersController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const query = querySchema.parse(request.query);

  const useCase = makeListCustomersUseCase();

  const result = await useCase.execute(query);

  return reply.status(200).send(result);
}

v1ListCustomersController.schema = {
  tags: ['Customers'],
  summary: 'List customers with pagination',
  security: [{ bearerAuth: [] }],
  querystring: querySchema,
  response: {
    200: responseSchema,
  },
};
