import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
import { categoryResponseSchema, updateCategorySchema } from '@/http/schemas';
import { makeUpdateCategoryUseCase } from '@/use-cases/stock/categories/factories/make-update-category-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updateCategoryController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/categories/:id',
    preHandler: [verifyJwt, verifyUserManager],
    schema: {
      tags: ['Categories'],
      summary: 'Update a category',
      params: z.object({
        id: z.uuid(),
      }),
      body: updateCategorySchema,
      response: {
        200: z.object({
          category: categoryResponseSchema,
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
      const { id } = request.params;
      const { name, slug, description, parentId, displayOrder, isActive } =
        request.body;

      try {
        const updateCategoryUseCase = makeUpdateCategoryUseCase();
        const { category } = await updateCategoryUseCase.execute({
          id,
          name,
          slug,
          description,
          parentId,
          displayOrder,
          isActive,
        });

        return reply.status(200).send({ category });
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
