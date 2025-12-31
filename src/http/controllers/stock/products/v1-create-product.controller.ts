import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { createProductSchema, productResponseSchema } from '@/http/schemas';
import { productToDTO } from '@/mappers/stock/product/product-to-dto';
import { makeCreateProductUseCase } from '@/use-cases/stock/products/factories/make-create-product-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createProductController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/products',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.PRODUCTS.CREATE,
        resource: 'products',
      }),
    ],
    schema: {
      tags: ['Stock - Products'],
      summary: 'Create a new product',
      body: createProductSchema,
      response: {
        201: z.object({
          product: productResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const {
        name,
        code,
        description,
        status,
        attributes,
        templateId,
        supplierId,
        manufacturerId,
      } = request.body;

      try {
        const createProductUseCase = makeCreateProductUseCase();
        const { product } = await createProductUseCase.execute({
          name,
          code, // Agora é opcional
          description,
          status,
          attributes,
          templateId,
          supplierId,
          manufacturerId,
        });

        return reply.status(201).send({ product: productToDTO(product) });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
