import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { makeListManufacturersUseCase } from '@/use-cases/stock/manufacturers/factories/make-list-manufacturers-use-case';

const manufacturerSchema = z.object({
  id: z.string(),
  name: z.string(),
  country: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  isActive: z.boolean(),
});

const responseSchema = z.object({
  manufacturers: z.array(manufacturerSchema),
});

export async function v1ListManufacturersController(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  const useCase = makeListManufacturersUseCase();

  const result = await useCase.execute();

  return reply.send(result);
}

v1ListManufacturersController.schema = {
  tags: ['Manufacturers'],
  summary: 'List all manufacturers',
  security: [{ bearerAuth: [] }],
  response: {
    200: responseSchema,
  },
};
