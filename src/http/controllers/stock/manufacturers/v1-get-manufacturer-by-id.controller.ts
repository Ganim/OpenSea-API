import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PrismaManufacturersRepository } from '@/repositories/stock/prisma/prisma-manufacturers-repository';
import { GetManufacturerByIdUseCase } from '@/use-cases/stock/manufacturers/get-manufacturer-by-id';

const getManufacturerByIdParamsSchema = z.object({
  id: z.string().uuid(),
});

const getManufacturerByIdResponseSchema = z.object({
  manufacturer: z.object({
    id: z.string().uuid(),
    name: z.string(),
    country: z.string(),
    email: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    website: z.string().nullable().optional(),
    addressLine1: z.string().nullable().optional(),
    addressLine2: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    state: z.string().nullable().optional(),
    postalCode: z.string().nullable().optional(),
    rating: z.number().nullable().optional(),
    notes: z.string().nullable().optional(),
    isActive: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date().optional(),
  }),
});

export async function v1GetManufacturerByIdController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = getManufacturerByIdParamsSchema.parse(request.params);

  const manufacturersRepository = new PrismaManufacturersRepository();
  const getManufacturerByIdUseCase = new GetManufacturerByIdUseCase(
    manufacturersRepository,
  );

  try {
    const result = await getManufacturerByIdUseCase.execute({
      id: params.id,
    });

    return reply.status(200).send(result);
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: error.message });
    }
    throw error;
  }
}

v1GetManufacturerByIdController.schema = {
  tags: ['manufacturers'],
  summary: 'Get a manufacturer by ID',
  security: [{ bearerAuth: [] }],
  params: getManufacturerByIdParamsSchema,
  response: {
    200: getManufacturerByIdResponseSchema,
  },
} satisfies FastifyRequest['routeOptions']['schema'] & {
  tags: string[];
  summary: string;
  security: Array<Record<string, string[]>>;
};
