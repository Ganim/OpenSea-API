import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { makeListSuppliersUseCase } from '@/use-cases/stock/suppliers/factories/make-list-suppliers-use-case';

const supplierSchema = z.object({
  id: z.string(),
  name: z.string(),
  cnpj: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  isActive: z.boolean(),
  rating: z.number().optional(),
  createdAt: z.date(),
});

const responseSchema = z.object({
  suppliers: z.array(supplierSchema),
});

export async function v1ListSuppliersController(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  const useCase = makeListSuppliersUseCase();

  const result = await useCase.execute();

  return reply.send(result);
}

v1ListSuppliersController.schema = {
  tags: ['Suppliers'],
  summary: 'List all suppliers',
  security: [{ bearerAuth: [] }],
  response: {
    200: responseSchema,
  },
};
