import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { makeUpdateCustomerUseCase } from '@/use-cases/sales/customers/factories/make-update-customer-use-case';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const bodySchema = z.object({
  name: z.string().optional(),
  type: z.enum(['INDIVIDUAL', 'BUSINESS']).optional(),
  document: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
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

export async function v1UpdateCustomerController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = paramsSchema.parse(request.params);
  const body = bodySchema.parse(request.body);

  try {
    const useCase = makeUpdateCustomerUseCase();

    const result = await useCase.execute({ id, ...body });

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

v1UpdateCustomerController.schema = {
  tags: ['Customers'],
  summary: 'Update customer',
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
