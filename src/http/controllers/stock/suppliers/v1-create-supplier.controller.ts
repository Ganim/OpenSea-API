import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { makeCreateSupplierUseCase } from '@/use-cases/stock/suppliers/factories/make-create-supplier-use-case';

const bodySchema = z.object({
  name: z.string(),
  cnpj: z.string().optional(),
  taxId: z.string().optional(),
  contact: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  paymentTerms: z.string().optional(),
  rating: z.number().optional(),
  isActive: z.boolean().optional(),
  notes: z.string().optional(),
});

const responseSchema = z.object({
  supplier: z.object({
    id: z.string(),
    name: z.string(),
    cnpj: z.string().optional(),
    taxId: z.string().optional(),
    contact: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    website: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
    paymentTerms: z.string().optional(),
    rating: z.number().optional(),
    isActive: z.boolean(),
    notes: z.string().optional(),
    createdAt: z.date(),
    updatedAt: z.date().optional(),
  }),
});

export async function v1CreateSupplierController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = bodySchema.parse(request.body);

  try {
    const useCase = makeCreateSupplierUseCase();

    const result = await useCase.execute(body);

    return reply.status(201).send(result);
  } catch (error) {
    if (error instanceof BadRequestError) {
      return reply.status(400).send({ message: error.message });
    }

    throw error;
  }
}

v1CreateSupplierController.schema = {
  tags: ['stock/suppliers'],
  summary: 'Create a new supplier',
  security: [{ bearerAuth: [] }],
  body: bodySchema,
  response: {
    201: responseSchema,
    400: z.object({
      message: z.string(),
    }),
  },
};
