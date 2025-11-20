import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
import { categoryResponseSchema, categorySchema } from '@/http/schemas';
import { categoryToDTO } from '@/mappers/stock/category/category-to-dto';
import { makeCreateCategoryUseCase } from '@/use-cases/stock/categories/factories/make-create-category-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createCategoryController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/categories',
    preHandler: [verifyJwt, verifyUserManager],
    schema: {
      tags: ['Categories'],
      summary: 'Create a new category',
      body: categorySchema,
      response: {
        201: z.object({
          category: categoryResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { name, slug, description, parentId, displayOrder, isActive } =
        request.body;

      try {
        const createCategoryUseCase = makeCreateCategoryUseCase();
        const { category } = await createCategoryUseCase.execute({
          name,
          slug,
          description,
          parentId,
          displayOrder,
          isActive,
        });

        return reply.status(201).send({ category: categoryToDTO(category) });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
