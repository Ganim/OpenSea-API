import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { reconciliationResponseSchema } from '@/http/schemas/finance';
import { makeGetReconciliationByIdUseCase } from '@/use-cases/finance/reconciliation/factories/make-get-reconciliation-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getReconciliationByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/reconciliation/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.BANK_ACCOUNTS.ACCESS,
        resource: 'bank-accounts',
      }),
    ],
    schema: {
      tags: ['Finance - Reconciliation'],
      summary: 'Get reconciliation by ID with items',
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({ reconciliation: reconciliationResponseSchema }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params as { id: string };

      try {
        const useCase = makeGetReconciliationByIdUseCase();
        const result = await useCase.execute({
          tenantId,
          reconciliationId: id,
        });

        return reply.status(200).send(result);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
