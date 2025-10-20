import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
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
      body: z.object({
        name: z.string().min(1).max(128),
        slug: z.string().min(1).max(128).optional(),
        description: z.string().max(500).optional(),
        parentId: z.string().uuid().optional(),
        displayOrder: z.number().int().min(0).optional(),
        isActive: z.boolean().optional(),
      }),
      response: {
        201: z.object({
          category: z.object({
            id: z.string().uuid(),
            name: z.string(),
            slug: z.string(),
            description: z.string().nullable().optional(),
            parentId: z.string().uuid().nullable().optional(),
            displayOrder: z.number(),
            isActive: z.boolean(),
            createdAt: z.coerce.date(),
            updatedAt: z.coerce.date().optional(),
          }),
        }),
        400: z.object({
          message: z.string(),
        }),
      },
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

        return reply.status(201).send({ category });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
