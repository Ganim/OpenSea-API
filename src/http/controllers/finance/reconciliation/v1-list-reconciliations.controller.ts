import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  reconciliationResponseSchema,
  listReconciliationsQuerySchema,
  paginationMetaSchema,
} from '@/http/schemas/finance';
import { makeListReconciliationsUseCase } from '@/use-cases/finance/reconciliation/factories/make-list-reconciliations-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listReconciliationsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/reconciliation',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.BANK_ACCOUNTS.ACCESS,
        resource: 'bank-accounts',
      }),
    ],
    schema: {
      tags: ['Finance - Reconciliation'],
      summary: 'List bank reconciliations',
      security: [{ bearerAuth: [] }],
      querystring: listReconciliationsQuerySchema,
      response: {
        200: z.object({
          reconciliations: z.array(reconciliationResponseSchema),
          meta: paginationMetaSchema,
        }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const query = request.query as z.infer<
        typeof listReconciliationsQuerySchema
      >;

      const useCase = makeListReconciliationsUseCase();
      const result = await useCase.execute({
        tenantId,
        ...query,
      });

      return reply.status(200).send(result);
    },
  });
}
