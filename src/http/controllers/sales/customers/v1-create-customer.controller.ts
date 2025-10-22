import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { makeCreateCustomerUseCase } from '@/use-cases/sales/customers/factories/make-create-customer-use-case';

const bodySchema = z.object({
  name: z.string(),
  type: z.enum(['INDIVIDUAL', 'BUSINESS']),
  document: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
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

export async function v1CreateCustomerController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = bodySchema.parse(request.body);

  try {
    const useCase = makeCreateCustomerUseCase();

    const result = await useCase.execute(body);

    return reply.status(201).send(result);
  } catch (error) {
    if (error instanceof BadRequestError) {
      return reply.status(400).send({ message: error.message });
    }

    throw error;
  }
}

v1CreateCustomerController.schema = {
  tags: ['Customers'],
  summary: 'Create a new customer',
  security: [{ bearerAuth: [] }],
  body: bodySchema,
  response: {
    201: responseSchema,
    400: z.object({
      message: z.string(),
    }),
  },
};
