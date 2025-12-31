import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
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
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.CATEGORIES.CREATE,
        resource: 'categories',
      }),
    ],
    schema: {
      tags: ['Stock - Categories'],
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
