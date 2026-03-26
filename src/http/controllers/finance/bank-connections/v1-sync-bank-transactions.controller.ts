import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeSyncBankTransactionsUseCase } from '@/use-cases/finance/bank-connections/factories/make-sync-bank-transactions-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function syncBankTransactionsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/finance/bank-connections/:id/sync',
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
      summary: 'Manual sync of bank transactions',
      security: [{ bearerAuth: [] }],
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        200: z.object({
          transactionsImported: z.number(),
          matchedCount: z.number(),
          lastSyncAt: z.string().nullable(),
        }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;

      try {
        const useCase = makeSyncBankTransactionsUseCase();
        const result = await useCase.execute({
          tenantId,
          connectionId: id,
        });

        return reply.status(200).send({
          transactionsImported: result.transactionsImported,
          matchedCount: result.matchedCount,
          lastSyncAt: result.connection.lastSyncAt?.toISOString() ?? null,
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
