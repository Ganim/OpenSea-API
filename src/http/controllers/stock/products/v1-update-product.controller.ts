import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
import { productResponseSchema, updateProductSchema } from '@/http/schemas';
import { productToDTO } from '@/mappers/stock/product/product-to-dto';
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
        productId: z.uuid(),
      }),
      body: updateProductSchema,
      response: {
        200: z.object({
          product: productResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
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

        return reply.status(200).send({ product: productToDTO(product) });
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
