import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGenerateRaisReportUseCase } from '@/use-cases/hr/reports/factories/make-generate-rais-report-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1GenerateRaisReportController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/reports/rais',
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
      summary: 'Generate RAIS report (Relação Anual de Informações Sociais)',
      description:
        'Generates the annual RAIS report required by the Brazilian Ministry of Labor. Includes all employees, admissions, terminations, salaries, and working hours for the specified year.',
      body: z.object({
        year: z.coerce.number().int().min(2000).max(2100),
      }),
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { year } = request.body;

      const useCase = makeGenerateRaisReportUseCase();
      const report = await useCase.execute({ tenantId, year });

      return reply.status(200).send(report);
    },
  });
}
