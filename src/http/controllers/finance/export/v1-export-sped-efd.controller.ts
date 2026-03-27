import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeExportSpedEfdUseCase } from '@/use-cases/finance/export/factories/make-export-sped-efd-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const spedEfdQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  companyId: z.string().uuid().optional(),
});

export async function exportSpedEfdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/export/sped-efd',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.ENTRIES.EXPORT,
        resource: 'export',
      }),
    ],
    schema: {
      tags: ['Finance - Export'],
      summary:
        'Export SPED EFD-Contribuições (PIS/COFINS) text file for a given month',
      security: [{ bearerAuth: [] }],
      querystring: spedEfdQuerySchema,
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const query = request.query as {
        year: number;
        month: number;
        companyId?: string;
      };

      const useCase = makeExportSpedEfdUseCase();
      const result = await useCase.execute({
        tenantId,
        year: query.year,
        month: query.month,
        companyId: query.companyId,
      });

      return reply
        .status(200)
        .header('Content-Type', result.mimeType)
        .header(
          'Content-Disposition',
          `attachment; filename="${result.fileName}"`,
        )
        .send(result.content);
    },
  });
}
