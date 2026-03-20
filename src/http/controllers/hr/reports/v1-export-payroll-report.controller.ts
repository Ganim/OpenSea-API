import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGeneratePayrollReportUseCase } from '@/use-cases/hr/reports/factories/make-generate-payroll-report-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ExportPayrollReportController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/reports/payroll',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.EMPLOYEES.ACCESS,
        resource: 'reports',
      }),
    ],
    schema: {
      tags: ['HR - Reports'],
      summary: 'Export payroll report',
      querystring: z.object({
        referenceMonth: z.coerce.number().int().min(1).max(12),
        referenceYear: z.coerce.number().int().min(2000).max(2100),
      }),
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { referenceMonth, referenceYear } = request.query;

      const useCase = makeGeneratePayrollReportUseCase();
      const { csv, fileName } = await useCase.execute({
        tenantId,
        referenceMonth,
        referenceYear,
      });

      return reply
        .header('Content-Type', 'text/csv; charset=utf-8')
        .header('Content-Disposition', `attachment; filename="${fileName}"`)
        .send(csv);
    },
  });
}
