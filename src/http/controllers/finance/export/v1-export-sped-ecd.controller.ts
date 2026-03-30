import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeExportSpedEcdUseCase } from '@/use-cases/finance/export/factories/make-export-sped-ecd-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const spedEcdQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  companyId: z.string().uuid().optional(),
});

export async function exportSpedEcdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/export/sped-ecd',
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
        'Export SPED ECD (Escrituração Contábil Digital) text file for a given year',
      security: [{ bearerAuth: [] }],
      querystring: spedEcdQuerySchema,
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const query = request.query as {
        year: number;
        companyId?: string;
      };

      const useCase = makeExportSpedEcdUseCase();
      const result = await useCase.execute({
        tenantId,
        year: query.year,
        companyId: query.companyId,
      });

      return reply
        .status(200)
        .header('Content-Type', 'text/plain; charset=utf-8')
        .header(
          'Content-Disposition',
          `attachment; filename="${result.fileName}"`,
        )
        .send(result.content);
    },
  });
}
