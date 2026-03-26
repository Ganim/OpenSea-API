import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { cashierSessionResponseSchema } from '@/http/schemas/sales/cashier/cashier.schema';
import { makeGetActiveSessionUseCase } from '@/use-cases/sales/cashier/factories/make-get-active-session-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getActiveSessionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/sales/cashier/sessions/active',
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
      summary: 'Get the active (OPEN) session for the current user',
      response: {
        200: z.object({
          cashierSession: cashierSessionResponseSchema.nullable(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      const useCase = makeGetActiveSessionUseCase();
      const { cashierSession } = await useCase.execute({
        tenantId,
        cashierId: userId,
      });

      return reply.status(200).send({ cashierSession } as any);
    },
  });
}
