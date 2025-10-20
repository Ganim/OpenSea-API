import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
import { makeUpdateProductUseCase } from '@/use-cases/stock/products/factories/make-update-product-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updateProductController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/products/:productId',
    preHandler: [verifyJwt, verifyUserManager],
    schema: {
      tags: ['Products'],
      summary: 'Update a product',
      params: z.object({
        productId: z.string().uuid(),
      }),
      body: z.object({
        name: z.string().min(1).max(255).optional(),
        description: z.string().max(2000).optional(),
        status: z.enum(['ACTIVE', 'INACTIVE', 'DISCONTINUED']).optional(),
        unitOfMeasure: z.enum(['UNITS', 'KILOGRAMS', 'METERS']).optional(),
        attributes: z.record(z.string(), z.unknown()).optional(),
        supplierId: z.string().uuid().optional(),
        manufacturerId: z.string().uuid().optional(),
      }),
      response: {
        200: z.object({
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
        404: z.object({
          message: z.string(),
        }),
      },
    },

    handler: async (request, reply) => {
      const { productId } = request.params;
      const {
        name,
        description,
        status,
        unitOfMeasure,
        attributes,
        supplierId,
        manufacturerId,
      } = request.body;

      try {
        const updateProductUseCase = makeUpdateProductUseCase();
        const { product } = await updateProductUseCase.execute({
          id: productId,
          name,
          description,
          status,
          unitOfMeasure,
          attributes,
          supplierId,
          manufacturerId,
        });

        return reply.status(200).send({ product });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
