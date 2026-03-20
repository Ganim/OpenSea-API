import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { listRecurringConfigsQuerySchema } from '@/http/schemas/finance/recurring/recurring-config.schema';
import { makeListRecurringConfigsUseCase } from '@/use-cases/finance/recurring/factories/make-list-recurring-configs';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function listRecurringConfigsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/recurring',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.RECURRING.ACCESS,
        resource: 'recurring',
      }),
    ],
    schema: {
      tags: ['Finance - Recurring'],
      summary: 'List recurring configs',
      security: [{ bearerAuth: [] }],
      querystring: listRecurringConfigsQuerySchema,
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const query = request.query as {
        page: number;
        limit: number;
        type?: string;
        status?: string;
        search?: string;
      };

      const useCase = makeListRecurringConfigsUseCase();
      const result = await useCase.execute({
        tenantId,
        ...query,
      });

      reply.header('Cache-Control', 'private, max-age=60');
      return reply.status(200).send({
        data: result.configs,
        meta: {
          total: result.total,
          page: query.page,
          limit: query.limit,
          pages: Math.ceil(result.total / query.limit),
        },
      });
    },
  });
}
