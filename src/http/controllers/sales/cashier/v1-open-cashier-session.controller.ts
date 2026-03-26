import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  cashierSessionResponseSchema,
  openCashierSessionSchema,
} from '@/http/schemas/sales/cashier/cashier.schema';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeOpenCashierSessionUseCase } from '@/use-cases/sales/cashier/factories/make-open-cashier-session-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function openCashierSessionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/sales/cashier/sessions',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.CASHIER.OPEN,
        resource: 'cashier',
      }),
    ],
    schema: {
      tags: ['Sales - Cashier'],
      summary: 'Open a new cashier session',
      body: openCashierSessionSchema,
      response: {
        201: z.object({ cashierSession: cashierSessionResponseSchema }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const body = request.body;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user } = await getUserByIdUseCase.execute({ userId });
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const useCase = makeOpenCashierSessionUseCase();
        const { cashierSession } = await useCase.execute({
          tenantId,
          cashierId: userId,
          posTerminalId: body.posTerminalId,
          openingBalance: body.openingBalance,
          notes: body.notes,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.CASHIER_SESSION_OPEN,
          entityId: cashierSession.id,
          placeholders: { userName },
          newData: { openingBalance: body.openingBalance },
        });

        return reply.status(201).send({ cashierSession } as any);
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
