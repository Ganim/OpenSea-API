import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeDeleteStoreCreditUseCase } from '@/use-cases/sales/store-credits/factories/make-delete-store-credit-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1DeleteStoreCreditController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/store-credits/:storeCreditId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.STORE_CREDITS.REMOVE,
        resource: 'store-credits',
      }),
    ],
    schema: {
      tags: ['Store Credits'],
      summary: 'Delete a store credit',
      params: z.object({
        storeCreditId: z.string().uuid(),
      }),
      response: {
        204: z.null(),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { storeCreditId } = request.params;

      try {
        const useCase = makeDeleteStoreCreditUseCase();
        const { deletedStoreCredit } = await useCase.execute({
          tenantId,
          storeCreditId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.STORE_CREDIT_DELETE,
          entityId: storeCreditId,
          placeholders: {
            userName: request.user.sub,
            amount: deletedStoreCredit.amount.toFixed(2),
            customerName: deletedStoreCredit.customerId.toString(),
          },
          oldData: {
            id: deletedStoreCredit.id.toString(),
            customerId: deletedStoreCredit.customerId.toString(),
            amount: deletedStoreCredit.amount,
            balance: deletedStoreCredit.balance,
            source: deletedStoreCredit.source,
          },
        });

        return reply.status(204).send(null);
      } catch (err) {
        if (err instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
