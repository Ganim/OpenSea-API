import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGenerateEmployeesReportUseCase } from '@/use-cases/hr/reports/factories/make-generate-employees-report-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ExportEmployeesReportController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/reports/employees',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.REPORTS.HR.HEADCOUNT,
        resource: 'reports',
      }),
    ],
    schema: {
      tags: ['HR - Reports'],
      summary: 'Export employees report',
      querystring: z.object({
        status: z.string().optional(),
        departmentId: z.string().uuid().optional(),
        positionId: z.string().uuid().optional(),
        companyId: z.string().uuid().optional(),
      }),
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { status, departmentId, positionId, companyId } = request.query;

      const useCase = makeGenerateEmployeesReportUseCase();
      const { csv, fileName } = await useCase.execute({
        tenantId,
        status,
        departmentId,
        positionId,
        companyId,
      });

      return reply
        .header('Content-Type', 'text/csv; charset=utf-8')
        .header('Content-Disposition', `attachment; filename="${fileName}"`)
        .send(csv);
    },
  });
}
