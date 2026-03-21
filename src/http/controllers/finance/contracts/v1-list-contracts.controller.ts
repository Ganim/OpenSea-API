import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  listContractsQuerySchema,
  contractResponseSchema,
} from '@/http/schemas/finance';
import { makeListContractsUseCase } from '@/use-cases/finance/contracts/factories/make-list-contracts-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listContractsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/contracts',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.CONTRACTS.ACCESS,
        resource: 'contracts',
      }),
    ],
    schema: {
      tags: ['Finance - Contracts'],
      summary: 'List contracts',
      security: [{ bearerAuth: [] }],
      querystring: listContractsQuerySchema,
      response: {
        200: z.object({
          contracts: z.array(contractResponseSchema),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            pages: z.number(),
          }),
        }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const query = request.query;

      const useCase = makeListContractsUseCase();
      const result = await useCase.execute({
        tenantId,
        page: query.page,
        limit: query.limit,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        status: query.status,
        companyName: query.companyName,
        search: query.search,
        startDateFrom: query.startDateFrom,
        startDateTo: query.startDateTo,
        endDateFrom: query.endDateFrom,
        endDateTo: query.endDateTo,
      });

      const pages = Math.ceil(result.total / (query.limit ?? 20));

      reply.header('Cache-Control', 'private, max-age=60');
      return reply.status(200).send({
        contracts: result.contracts,
        meta: {
          total: result.total,
          page: query.page ?? 1,
          limit: query.limit ?? 20,
          pages,
        },
      });
    },
  });
}
