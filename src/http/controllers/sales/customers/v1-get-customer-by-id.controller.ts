import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { makeGetCustomerByIdUseCase } from '@/use-cases/sales/customers/factories/make-get-customer-by-id-use-case';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const responseSchema = z.object({
  customer: z.object({
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
});

export async function v1GetCustomerByIdController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = paramsSchema.parse(request.params);

  try {
    const useCase = makeGetCustomerByIdUseCase();

    const result = await useCase.execute({ id });

    return reply.status(200).send(result);
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: error.message });
    }

    throw error;
  }
}

v1GetCustomerByIdController.schema = {
  tags: ['Customers'],
  summary: 'Get customer by ID',
  security: [{ bearerAuth: [] }],
  params: paramsSchema,
  response: {
    200: responseSchema,
    404: z.object({
      message: z.string(),
    }),
  },
};
