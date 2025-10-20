import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
import { makeCreateProductUseCase } from '@/use-cases/stock/products/factories/make-create-product-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createProductController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/products',
    preHandler: [verifyJwt, verifyUserManager],
    schema: {
      tags: ['Products'],
      summary: 'Create a new product',
      body: z.object({
        name: z.string().min(1).max(255),
        code: z.string().min(1).max(100),
        description: z.string().max(2000).optional(),
        status: z.enum(['ACTIVE', 'INACTIVE', 'DISCONTINUED']).optional(),
        unitOfMeasure: z.enum(['UNITS', 'KILOGRAMS', 'METERS']),
        attributes: z.record(z.string(), z.unknown()).optional(),
        templateId: z.string().uuid(),
        supplierId: z.string().uuid().optional(),
        manufacturerId: z.string().uuid().optional(),
      }),
      response: {
        201: z.object({
          product: z.object({
            id: z.string().uuid(),
            name: z.string(),
            code: z.string(),
            description: z.string().optional(),
            status: z.string(),
            unitOfMeasure: z.string(),
            attributes: z.record(z.string(), z.unknown()),
            templateId: z.string().uuid(),
            supplierId: z.string().uuid().optional(),
            manufacturerId: z.string().uuid().optional(),
          }),
        }),
        400: z.object({
          message: z.string(),
        }),
      },
    },

    handler: async (request, reply) => {
      const {
        name,
        code,
        description,
        status,
        unitOfMeasure,
        attributes,
        templateId,
        supplierId,
        manufacturerId,
      } = request.body;

      try {
        const createProductUseCase = makeCreateProductUseCase();
        const { product } = await createProductUseCase.execute({
          name,
          code,
          description,
          status,
          unitOfMeasure,
          attributes,
          templateId,
          supplierId,
          manufacturerId,
        });

        return reply.status(201).send({ product });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
