import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  cashflowAccuracyQuerySchema,
  cashflowAccuracyResponseSchema,
} from '@/http/schemas/finance';
import { makeGetCashflowAccuracyUseCase } from '@/use-cases/finance/dashboard/factories/make-get-cashflow-accuracy-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function getCashflowAccuracyController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/dashboard/cashflow-accuracy',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.ENTRIES.ACCESS,
        resource: 'dashboard',
      }),
    ],
    schema: {
      tags: ['Finance - Dashboard'],
      summary: 'Get cashflow accuracy (realized vs projected comparison)',
      security: [{ bearerAuth: [] }],
      querystring: cashflowAccuracyQuerySchema,
      response: {
        200: cashflowAccuracyResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const query = request.query as {
        startDate: Date;
        endDate: Date;
      };

      const useCase = makeGetCashflowAccuracyUseCase();
      const result = await useCase.execute({
        tenantId,
        startDate: query.startDate,
        endDate: query.endDate,
      });

      reply.header('Cache-Control', 'private, max-age=60');
      return reply.status(200).send(result);
    },
  });
}
