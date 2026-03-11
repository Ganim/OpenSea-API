import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetInteractiveDREUseCase } from '@/use-cases/finance/dashboard/factories/make-get-dre-interactive';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const dreQuerySchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  categoryId: z.string().uuid().optional(),
});

export async function getDREInteractiveController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/dashboard/dre',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.ENTRIES.READ,
        resource: 'entries',
      }),
    ],
    schema: {
      tags: ['Finance - Dashboard'],
      summary:
        'Get interactive DRE with hierarchical categories and period comparison',
      security: [{ bearerAuth: [] }],
      querystring: dreQuerySchema,
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const query = request.query as {
        startDate: Date;
        endDate: Date;
        categoryId?: string;
      };

      const useCase = makeGetInteractiveDREUseCase();
      const result = await useCase.execute({
        tenantId,
        ...query,
      });

      return reply.status(200).send(result);
    },
  });
}
