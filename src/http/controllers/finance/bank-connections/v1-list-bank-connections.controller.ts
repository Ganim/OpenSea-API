import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeListBankConnectionsUseCase } from '@/use-cases/finance/bank-connections/factories/make-list-bank-connections-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listBankConnectionsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/bank-connections',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.BANK_ACCOUNTS.ACCESS,
        resource: 'bank-accounts',
      }),
    ],
    schema: {
      tags: ['Finance - Bank Connections'],
      summary: 'List all bank connections for the tenant',
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({
          data: z.array(
            z.object({
              id: z.string(),
              bankAccountId: z.string(),
              provider: z.string(),
              externalItemId: z.string(),
              status: z.string(),
              lastSyncAt: z.string().nullable(),
              createdAt: z.string(),
              updatedAt: z.string(),
            }),
          ),
        }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const useCase = makeListBankConnectionsUseCase();
      const { connections } = await useCase.execute({ tenantId });

      return reply.status(200).send({
        data: connections.map((c) => ({
          id: c.id,
          bankAccountId: c.bankAccountId,
          provider: c.provider,
          externalItemId: c.externalItemId,
          status: c.status,
          lastSyncAt: c.lastSyncAt?.toISOString() ?? null,
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt.toISOString(),
        })),
      });
    },
  });
}
