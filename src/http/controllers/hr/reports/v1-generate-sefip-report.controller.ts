import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGenerateSefipReportUseCase } from '@/use-cases/hr/reports/factories/make-generate-sefip-report-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1GenerateSefipReportController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/reports/sefip',
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
      summary: 'Generate SEFIP report (FGTS and social security)',
      description:
        'Generates the monthly SEFIP report for FGTS collection and social security contributions. Includes employee data, FGTS base, and INSS contributions for the specified month.',
      body: z.object({
        year: z.coerce.number().int().min(2000).max(2100),
        month: z.coerce.number().int().min(1).max(12),
      }),
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { year, month } = request.body;

      const useCase = makeGenerateSefipReportUseCase();
      const report = await useCase.execute({ tenantId, year, month });

      return reply.status(200).send(report);
    },
  });
}
