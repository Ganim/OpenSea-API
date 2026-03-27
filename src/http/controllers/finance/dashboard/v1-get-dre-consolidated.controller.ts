import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetConsolidatedDREUseCase } from '@/use-cases/finance/dashboard/factories/make-get-dre-consolidated';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const dreConsolidatedQuerySchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  companyIds: z.string().optional(),
});

export async function getDREConsolidatedController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/dashboard/dre-consolidated',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.ENTRIES.ACCESS,
        resource: 'entries',
      }),
    ],
    schema: {
      tags: ['Finance - Dashboard'],
      summary:
        'Get consolidated DRE across multiple companies with per-company breakdown',
      security: [{ bearerAuth: [] }],
      querystring: dreConsolidatedQuerySchema,
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const query = request.query as {
        startDate: Date;
        endDate: Date;
        companyIds?: string;
      };

      const companyIds = query.companyIds
        ? query.companyIds.split(',').map((id) => id.trim())
        : undefined;

      const useCase = makeGetConsolidatedDREUseCase();
      const result = await useCase.execute({
        tenantId,
        startDate: query.startDate,
        endDate: query.endDate,
        companyIds,
      });

      reply.header('Cache-Control', 'private, max-age=30');
      return reply.status(200).send(result);
    },
  });
}
