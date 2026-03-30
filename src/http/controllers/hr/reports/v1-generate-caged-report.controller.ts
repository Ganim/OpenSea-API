import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGenerateCagedReportUseCase } from '@/use-cases/hr/reports/factories/make-generate-caged-report-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1GenerateCagedReportController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/reports/caged',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.REPORTS.EXPORT,
        resource: 'reports',
      }),
    ],
    schema: {
      tags: ['HR - Reports'],
      summary: 'Generate CAGED report (admissions and terminations)',
      description:
        'Generates the monthly CAGED report of employee admissions and terminations. Required by Brazilian law for tracking employment movements.',
      body: z.object({
        year: z.coerce.number().int().min(2000).max(2100),
        month: z.coerce.number().int().min(1).max(12),
      }),
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { year, month } = request.body;

      const useCase = makeGenerateCagedReportUseCase();
      const report = await useCase.execute({ tenantId, year, month });

      return reply.status(200).send(report);
    },
  });
}
