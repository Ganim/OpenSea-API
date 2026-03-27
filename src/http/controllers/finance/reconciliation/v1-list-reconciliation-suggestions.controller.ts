import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  reconciliationSuggestionResponseSchema,
  listReconciliationSuggestionsQuerySchema,
  paginationMetaSchema,
} from '@/http/schemas/finance';
import { makeListReconciliationSuggestionsUseCase } from '@/use-cases/finance/reconciliation/factories/make-list-reconciliation-suggestions-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listReconciliationSuggestionsController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/reconciliation/suggestions',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.ENTRIES.MODIFY,
        resource: 'entries',
      }),
    ],
    schema: {
      tags: ['Finance - Reconciliation'],
      summary: 'List reconciliation suggestions',
      security: [{ bearerAuth: [] }],
      querystring: listReconciliationSuggestionsQuerySchema,
      response: {
        200: z.object({
          suggestions: z.array(reconciliationSuggestionResponseSchema),
          meta: paginationMetaSchema,
        }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const query = request.query as z.infer<
        typeof listReconciliationSuggestionsQuerySchema
      >;

      const useCase = makeListReconciliationSuggestionsUseCase();
      const result = await useCase.execute({
        tenantId,
        ...query,
      });

      return reply.status(200).send(result);
    },
  });
}
