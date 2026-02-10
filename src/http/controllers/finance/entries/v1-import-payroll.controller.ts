import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makePayrollToFinanceUseCase } from '@/use-cases/finance/entries/factories/make-payroll-to-finance-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function importPayrollController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/finance/import/payroll/:payrollId',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.ENTRIES.MANAGE,
        resource: 'entries',
      }),
    ],
    schema: {
      tags: ['Finance - Entries'],
      summary: 'Import payroll as finance entries',
      security: [{ bearerAuth: [] }],
      params: z.object({
        payrollId: z.string().uuid(),
      }),
      response: {
        201: z.object({
          entriesCreated: z.number(),
          totalAmount: z.number(),
        }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { payrollId } = request.params as { payrollId: string };

      const useCase = makePayrollToFinanceUseCase();
      const result = await useCase.execute({
        tenantId,
        payrollId,
      });

      return reply.status(201).send(result);
    },
  });
}
