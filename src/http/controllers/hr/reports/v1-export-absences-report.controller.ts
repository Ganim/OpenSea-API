import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGenerateAbsencesReportUseCase } from '@/use-cases/hr/reports/factories/make-generate-absences-report-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ExportAbsencesReportController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/reports/absences',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.ABSENCES.ACCESS,
        resource: 'reports',
      }),
    ],
    schema: {
      tags: ['HR - Reports'],
      summary: 'Export absences report',
      querystring: z.object({
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
        employeeId: z.string().uuid().optional(),
        type: z.string().optional(),
        status: z.string().optional(),
      }),
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { startDate, endDate, employeeId, type, status } = request.query;

      const useCase = makeGenerateAbsencesReportUseCase();
      const { csv, fileName } = await useCase.execute({
        tenantId,
        startDate,
        endDate,
        employeeId,
        type,
        status,
      });

      return reply
        .header('Content-Type', 'text/csv; charset=utf-8')
        .header('Content-Disposition', `attachment; filename="${fileName}"`)
        .send(csv);
    },
  });
}
