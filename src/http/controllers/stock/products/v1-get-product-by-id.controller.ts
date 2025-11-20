import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { productResponseSchema } from '@/http/schemas';
import { productToDTO } from '@/mappers/stock/product/product-to-dto';
import { makeGetProductByIdUseCase } from '@/use-cases/stock/products/factories/make-get-product-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getProductByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/products/:productId',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Products'],
      summary: 'Get a product by ID',
      params: z.object({
        productId: z.uuid(),
      }),
      response: {
        200: z.object({
          product: productResponseSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { productId } = request.params;

      try {
        const getProductByIdUseCase = makeGetProductByIdUseCase();
        const { product } = await getProductByIdUseCase.execute({
          id: productId,
        });

        return reply.status(200).send({ product: productToDTO(product) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
