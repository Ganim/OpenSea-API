import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { categoryResponseSchema, categorySchema } from '@/http/schemas';
import { categoryToDTO } from '@/mappers/stock/category/category-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
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
      verifyTenant,
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
      const tenantId = request.user.tenantId!;
      const {
        name,
        slug,
        description,
        iconUrl,
        parentId,
        displayOrder,
        isActive,
      } = request.body;
      const userId = request.user.sub;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user } = await getUserByIdUseCase.execute({ userId });
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const createCategoryUseCase = makeCreateCategoryUseCase();
        const { category } = await createCategoryUseCase.execute({
          tenantId,
          name,
          slug,
          description,
          iconUrl,
          parentId,
          displayOrder,
          isActive,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.STOCK.CATEGORY_CREATE,
          entityId: category.id.toString(),
          placeholders: { userName, categoryName: category.name },
          newData: {
            name,
            slug,
            description,
            iconUrl,
            parentId,
            displayOrder,
            isActive,
          },
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
