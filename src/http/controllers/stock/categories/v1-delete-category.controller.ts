import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeDeleteCategoryUseCase } from '@/use-cases/stock/categories/factories/make-delete-category-use-case';
import { makeGetCategoryByIdUseCase } from '@/use-cases/stock/categories/factories/make-get-category-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function deleteCategoryController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/categories/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.CATEGORIES.DELETE,
        resource: 'categories',
      }),
    ],
    schema: {
      tags: ['Stock - Categories'],
      summary: 'Delete a category (soft delete)',
      params: z.object({
        id: z.uuid(),
      }),
      response: {
        204: z.null().describe('Category deleted successfully'),
        404: z.object({
          message: z.string(),
        }),
      },
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;
      const userId = request.user.sub;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const getCategoryByIdUseCase = makeGetCategoryByIdUseCase();

        const [{ user }, { category }] = await Promise.all([
          getUserByIdUseCase.execute({ userId }),
          getCategoryByIdUseCase.execute({ tenantId, id }),
        ]);
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const deleteCategoryUseCase = makeDeleteCategoryUseCase();
        await deleteCategoryUseCase.execute({ tenantId, id });

        await logAudit(request, {
          message: AUDIT_MESSAGES.STOCK.CATEGORY_DELETE,
          entityId: id,
          placeholders: { userName, categoryName: category.name },
          oldData: { id: category.id.toString(), name: category.name },
        });

        return reply.status(204).send();
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
