import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { exportAccountingSchema } from '@/http/schemas/finance/export.schema';
import { makeExportAccountingDataUseCase } from '@/use-cases/finance/export/factories/make-export-accounting-data-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function exportAccountingController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/finance/export/accounting',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.EXPORT.GENERATE,
        resource: 'export',
      }),
    ],
    schema: {
      tags: ['Finance - Export'],
      summary: 'Export accounting data as CSV',
      security: [{ bearerAuth: [] }],
      body: exportAccountingSchema,
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const body = request.body as {
        format: 'CSV';
        reportType: 'ENTRIES' | 'BALANCE' | 'DRE' | 'CASHFLOW';
        startDate: Date;
        endDate: Date;
        type?: string;
        costCenterId?: string;
        categoryId?: string;
      };

      const useCase = makeExportAccountingDataUseCase();
      const result = await useCase.execute({
        tenantId,
        ...body,
      });

      return reply
        .status(200)
        .header('Content-Type', result.mimeType)
        .header(
          'Content-Disposition',
          `attachment; filename="${result.fileName}"`,
        )
        .send(result.data);
    },
  });
}
