import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { PrismaManufacturersRepository } from '@/repositories/stock/prisma/prisma-manufacturers-repository';
import { CreateManufacturerUseCase } from '@/use-cases/stock/manufacturers/create-manufacturer';

const createManufacturerBodySchema = z.object({
  name: z.string().min(1).max(255),
  country: z.string().min(1).max(100),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(50).optional(),
  website: z.string().url().max(255).optional(),
  addressLine1: z.string().max(255).optional(),
  addressLine2: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  rating: z.number().min(0).max(5).optional(),
  notes: z.string().max(1000).optional(),
  isActive: z.boolean().optional().default(true),
});

const createManufacturerResponseSchema = z.object({
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

export async function v1CreateManufacturerController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = createManufacturerBodySchema.parse(request.body);

  const manufacturersRepository = new PrismaManufacturersRepository();
  const createManufacturerUseCase = new CreateManufacturerUseCase(
    manufacturersRepository,
  );

  const result = await createManufacturerUseCase.execute({
    name: body.name,
    country: body.country,
    email: body.email,
    phone: body.phone,
    website: body.website,
    addressLine1: body.addressLine1,
    addressLine2: body.addressLine2,
    city: body.city,
    state: body.state,
    postalCode: body.postalCode,
    rating: body.rating,
    notes: body.notes,
  });

  return reply.status(201).send(result);
}

v1CreateManufacturerController.schema = {
  tags: ['Manufacturers'],
  summary: 'Create a new manufacturer',
  description: 'Create a new manufacturer with the provided information',
  body: createManufacturerBodySchema,
  response: {
    201: createManufacturerResponseSchema,
  },
  security: [{ bearerAuth: [] }],
};
