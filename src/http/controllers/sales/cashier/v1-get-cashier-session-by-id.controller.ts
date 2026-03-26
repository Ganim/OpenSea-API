import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { cashierSessionResponseSchema } from '@/http/schemas/sales/cashier/cashier.schema';
import { makeGetCashierSessionByIdUseCase } from '@/use-cases/sales/cashier/factories/make-get-cashier-session-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getCashierSessionByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/cashier-sessions/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.CASHIER.ACCESS,
        resource: 'cashier',
      }),
    ],
    schema: {
      tags: ['Sales - Cashier'],
      summary: 'Get cashier session by ID with transactions',
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({ cashierSession: cashierSessionResponseSchema }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params;
      const tenantId = request.user.tenantId!;

      try {
        const useCase = makeGetCashierSessionByIdUseCase();
        const { cashierSession } = await useCase.execute({
          tenantId,
          sessionId: id,
        });

        return reply.status(200).send({ cashierSession } as any);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
