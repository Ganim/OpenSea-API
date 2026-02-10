import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  loanResponseSchema,
  listLoansQuerySchema,
} from '@/http/schemas/finance';
import { makeListLoansUseCase } from '@/use-cases/finance/loans/factories/make-list-loans-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listLoansController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/loans',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.LOANS.LIST,
        resource: 'loans',
      }),
    ],
    schema: {
      tags: ['Finance - Loans'],
      summary: 'List loans',
      security: [{ bearerAuth: [] }],
      querystring: listLoansQuerySchema,
      response: {
        200: z.object({
          loans: z.array(loanResponseSchema),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            pages: z.number(),
          }),
        }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const useCase = makeListLoansUseCase();
      const result = await useCase.execute({ tenantId, ...request.query });

      return reply.status(200).send(result);
    },
  });
}
