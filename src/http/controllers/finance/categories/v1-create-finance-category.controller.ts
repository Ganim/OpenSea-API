import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createFinanceCategorySchema,
  financeCategoryResponseSchema,
} from '@/http/schemas/finance';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeCreateFinanceCategoryUseCase } from '@/use-cases/finance/categories/factories/make-create-finance-category-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function createFinanceCategoryController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/finance/categories',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.CATEGORIES.CREATE,
        resource: 'finance-categories',
      }),
    ],
    schema: {
      tags: ['Finance - Categories'],
      summary: 'Create a new finance category',
      security: [{ bearerAuth: [] }],
      body: createFinanceCategorySchema,
      response: {
        201: z.object({ category: financeCategoryResponseSchema }),
        400: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user } = await getUserByIdUseCase.execute({ userId });
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const useCase = makeCreateFinanceCategoryUseCase();
        const result = await useCase.execute({ tenantId, ...request.body });

        await logAudit(request, {
          message: AUDIT_MESSAGES.FINANCE.FINANCE_CATEGORY_CREATE,
          entityId: result.category.id,
          placeholders: { userName, categoryName: result.category.name },
          newData: request.body,
        });

        return reply.status(201).send(result);
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
