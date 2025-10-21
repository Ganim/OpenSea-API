import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { makeGetSupplierByIdUseCase } from '@/use-cases/stock/suppliers/factories/make-get-supplier-by-id-use-case';

const paramsSchema = z.object({
  id: z.string().uuid(),
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

export async function v1GetSupplierByIdController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = paramsSchema.parse(request.params);

  try {
    const useCase = makeGetSupplierByIdUseCase();

    const result = await useCase.execute({ id });

    return reply.status(200).send(result);
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: error.message });
    }

    throw error;
  }
}

v1GetSupplierByIdController.schema = {
  tags: ['Suppliers'],
  summary: 'Get supplier by ID',
  security: [{ bearerAuth: [] }],
  params: paramsSchema,
  response: {
    200: responseSchema,
    404: z.object({
      message: z.string(),
    }),
  },
};
