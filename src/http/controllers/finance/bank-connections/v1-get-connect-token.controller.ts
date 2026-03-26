import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetConnectTokenUseCase } from '@/use-cases/finance/bank-connections/factories/make-get-connect-token-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getConnectTokenController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/finance/bank-connections/connect-token',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.BANK_ACCOUNTS.ADMIN,
        resource: 'bank-accounts',
      }),
    ],
    schema: {
      tags: ['Finance - Bank Connections'],
      summary: 'Get Pluggy Connect widget token',
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({
          accessToken: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      const useCase = makeGetConnectTokenUseCase();
      const result = await useCase.execute({ tenantId, userId });

      return reply.status(200).send(result);
    },
  });
}
