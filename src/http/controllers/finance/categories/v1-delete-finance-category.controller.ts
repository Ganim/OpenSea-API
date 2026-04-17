import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeDeleteFinanceCategoryUseCase } from '@/use-cases/finance/categories/factories/make-delete-finance-category-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { errorResponseSchema } from '@/http/schemas/common/error-response.schema';

export async function deleteFinanceCategoryController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/finance/categories/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.CATEGORIES.REMOVE,
        resource: 'finance-categories',
      }),
    ],
    schema: {
      tags: ['Finance - Categories'],
      summary: 'Delete a finance category',
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      body: z
        .object({
          replacementCategoryId: z.string().uuid().optional(),
        })
        .nullable()
        .optional(),
      response: {
        204: z.null(),
        400: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { id } = request.params as { id: string };

      try {
        const { user } = await makeGetUserByIdUseCase().execute({ userId });
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const body = request.body as
          | { replacementCategoryId?: string }
          | undefined;
        const useCase = makeDeleteFinanceCategoryUseCase();
        await useCase.execute({
          tenantId,
          id,
          replacementCategoryId: body?.replacementCategoryId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.FINANCE.FINANCE_CATEGORY_DELETE,
          entityId: id,
          placeholders: { userName, categoryName: id },
        });

        return reply.status(204).send(null);
      } catch (error) {
        if (
          error instanceof ResourceNotFoundError ||
          error instanceof BadRequestError
        ) {
          // Let the global error handler handle it with proper codes
          throw error;
        }
        throw error;
      }
    },
  });
}
