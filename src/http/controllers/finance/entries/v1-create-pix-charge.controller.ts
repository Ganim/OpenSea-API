import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createPixChargeSchema,
  createPixChargeResponseSchema,
} from '@/http/schemas/finance';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeCreatePixChargeForEntryUseCase } from '@/use-cases/finance/entries/factories/make-create-pix-charge-for-entry-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function createPixChargeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/finance/entries/:id/pix-charge',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.ENTRIES.MODIFY,
        resource: 'entries',
      }),
    ],
    schema: {
      tags: ['Finance - Entries'],
      summary: 'Create a PIX charge for a receivable entry',
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      body: createPixChargeSchema,
      response: {
        201: createPixChargeResponseSchema,
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { id } = request.params as { id: string };

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user } = await getUserByIdUseCase.execute({ userId });
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const useCase = makeCreatePixChargeForEntryUseCase();
        const result = await useCase.execute({
          entryId: id,
          tenantId,
          ...request.body,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.FINANCE.FINANCE_ENTRY_PIX_CHARGE,
          entityId: id,
          placeholders: {
            userName,
            amount: result.amount.toFixed(2),
            entryCode: result.entry.code,
          },
          newData: {
            txId: result.txId,
            amount: result.amount,
            expiresAt: result.expiresAt.toISOString(),
          },
        });

        return reply.status(201).send(result);
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
