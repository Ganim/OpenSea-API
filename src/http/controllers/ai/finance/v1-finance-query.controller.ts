import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  financeQueryBodySchema,
  financeQueryResponseSchema,
} from '@/http/schemas/ai';
import { makeFinanceNaturalQueryUseCase } from '@/use-cases/ai/finance-natural-query/factories/make-finance-natural-query-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function financeQueryController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/ai/finance-query',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.ENTRIES.ACCESS,
        resource: 'finance-query',
      }),
    ],
    schema: {
      tags: ['AI - Finance'],
      summary: 'Query finances using natural language',
      description:
        'Permite fazer perguntas sobre finanças em linguagem natural. O sistema detecta a intenção e retorna dados relevantes.',
      security: [{ bearerAuth: [] }],
      body: financeQueryBodySchema,
      response: {
        200: financeQueryResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { query } = request.body;

      const useCase = makeFinanceNaturalQueryUseCase();
      const result = await useCase.execute({
        tenantId,
        userId,
        query,
      });

      return reply.status(200).send(result);
    },
  });
}
