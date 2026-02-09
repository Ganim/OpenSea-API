import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  financeEntryResponseSchema,
  listFinanceEntriesQuerySchema,
} from '@/http/schemas/finance';
import { makeListFinanceEntriesUseCase } from '@/use-cases/finance/entries/factories/make-list-finance-entries-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listFinanceEntriesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/entries',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.ENTRIES.LIST,
        resource: 'entries',
      }),
    ],
    schema: {
      tags: ['Finance - Entries'],
      summary: 'List finance entries',
      security: [{ bearerAuth: [] }],
      querystring: listFinanceEntriesQuerySchema,
      response: {
        200: z.object({
          entries: z.array(financeEntryResponseSchema),
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

      const useCase = makeListFinanceEntriesUseCase();
      const result = await useCase.execute({ tenantId, ...request.query });

      return reply.status(200).send(result);
    },
  });
}
