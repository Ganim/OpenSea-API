import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  forecastQuerySchema,
  forecastResponseSchema,
} from '@/http/schemas/finance';
import { makeGetForecastUseCase } from '@/use-cases/finance/dashboard/factories/make-get-forecast-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function getForecastController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/forecast',
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
      summary: 'Get financial forecast (payable vs receivable by period)',
      security: [{ bearerAuth: [] }],
      querystring: forecastQuerySchema,
      response: {
        200: forecastResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const query = request.query as {
        type?: string;
        startDate: Date;
        endDate: Date;
        groupBy: 'day' | 'week' | 'month';
        costCenterId?: string;
        categoryId?: string;
      };

      const useCase = makeGetForecastUseCase();
      const result = await useCase.execute({
        tenantId,
        ...query,
      });

      reply.header('Cache-Control', 'private, max-age=60');
      return reply.status(200).send(result);
    },
  });
}
