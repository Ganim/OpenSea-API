import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  balanceSheetQuerySchema,
  balanceSheetResponseSchema,
} from '@/http/schemas/finance';
import { makeGetBalanceSheetUseCase } from '@/use-cases/finance/dashboard/factories/make-get-balance-sheet-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function getBalanceSheetController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/dashboard/balance-sheet',
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
      summary: 'Get balance sheet (Balanço Patrimonial)',
      security: [{ bearerAuth: [] }],
      querystring: balanceSheetQuerySchema,
      response: {
        200: balanceSheetResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { startDate, endDate } = request.query as {
        startDate: Date;
        endDate: Date;
      };

      const useCase = makeGetBalanceSheetUseCase();
      const result = await useCase.execute({
        tenantId,
        startDate,
        endDate,
      });

      reply.header('Cache-Control', 'private, max-age=30');
      return reply.status(200).send(result);
    },
  });
}
