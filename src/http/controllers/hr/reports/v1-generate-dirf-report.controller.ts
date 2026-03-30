import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGenerateDirfReportUseCase } from '@/use-cases/hr/reports/factories/make-generate-dirf-report-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1GenerateDirfReportController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/reports/dirf',
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
      summary:
        'Generate DIRF report (Declaração do Imposto de Renda Retido na Fonte)',
      description:
        'Generates the annual DIRF income tax withholding report. Includes employee income, IRRF withheld, INSS contributions, and dependant deductions for the specified year.',
      body: z.object({
        year: z.coerce.number().int().min(2000).max(2100),
      }),
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { year } = request.body;

      const useCase = makeGenerateDirfReportUseCase();
      const report = await useCase.execute({ tenantId, year });

      return reply.status(200).send(report);
    },
  });
}
