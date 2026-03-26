import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  cashierSessionResponseSchema,
  closeCashierSessionSchema,
} from '@/http/schemas/sales/cashier/cashier.schema';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeCloseCashierSessionUseCase } from '@/use-cases/sales/cashier/factories/make-close-cashier-session-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function closeCashierSessionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/sales/cashier/sessions/:id/close',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.CASHIER.CLOSE,
        resource: 'cashier',
      }),
    ],
    schema: {
      tags: ['Sales - Cashier'],
      summary: 'Close a cashier session',
      params: z.object({ id: z.string().uuid() }),
      body: closeCashierSessionSchema,
      response: {
        200: z.object({ cashierSession: cashierSessionResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { id } = request.params;
      const body = request.body;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user } = await getUserByIdUseCase.execute({ userId });
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const useCase = makeCloseCashierSessionUseCase();
        const { cashierSession } = await useCase.execute({
          tenantId,
          sessionId: id,
          closingBalance: body.closingBalance,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.CASHIER_SESSION_CLOSE,
          entityId: cashierSession.id,
          placeholders: { userName },
          newData: {
            closingBalance: cashierSession.closingBalance,
            expectedBalance: cashierSession.expectedBalance,
            difference: cashierSession.difference,
          },
        });

        return reply.status(200).send({ cashierSession } as any);
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
