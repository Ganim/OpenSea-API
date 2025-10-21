import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { makeUpdateSupplierUseCase } from '@/use-cases/stock/suppliers/factories/make-update-supplier-use-case';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const bodySchema = z.object({
  name: z.string().optional(),
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

export async function v1UpdateSupplierController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = paramsSchema.parse(request.params);
  const body = bodySchema.parse(request.body);

  try {
    const useCase = makeUpdateSupplierUseCase();

    const result = await useCase.execute({
      id,
      ...body,
    });

    return reply.send(result);
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

v1UpdateSupplierController.schema = {
  tags: ['Suppliers'],
  summary: 'Update an existing supplier',
  security: [{ bearerAuth: [] }],
  response: {
    200: z.object({
      supplier: z.object({
        id: z.string().uuid(),
        name: z.string(),
        cnpj: z.string().nullable().optional(),
        taxId: z.string().nullable().optional(),
        contact: z.string().nullable().optional(),
        email: z.string().nullable().optional(),
        phone: z.string().nullable().optional(),
        website: z.string().nullable().optional(),
        address: z.string().nullable().optional(),
        city: z.string().nullable().optional(),
        state: z.string().nullable().optional(),
        zipCode: z.string().nullable().optional(),
        country: z.string().nullable().optional(),
        paymentTerms: z.string().nullable().optional(),
        rating: z.number().nullable().optional(),
        isActive: z.boolean(),
        notes: z.string().nullable().optional(),
        createdAt: z.date(),
        updatedAt: z.date().optional(),
      }),
    }),
  },
};
