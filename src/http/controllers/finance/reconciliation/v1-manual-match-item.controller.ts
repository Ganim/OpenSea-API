import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  reconciliationItemResponseSchema,
  manualMatchBodySchema,
} from '@/http/schemas/finance';
import { makeManualMatchItemUseCase } from '@/use-cases/finance/reconciliation/factories/make-manual-match-item-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function manualMatchItemController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/finance/reconciliation/:id/items/:itemId/match',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.BANK_ACCOUNTS.MODIFY,
        resource: 'bank-accounts',
      }),
    ],
    schema: {
      tags: ['Finance - Reconciliation'],
      summary: 'Manually match a reconciliation item to a finance entry',
      security: [{ bearerAuth: [] }],
      params: z.object({
        id: z.string().uuid(),
        itemId: z.string().uuid(),
      }),
      body: manualMatchBodySchema,
      response: {
        200: z.object({ item: reconciliationItemResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { id: reconciliationId, itemId } = request.params as {
        id: string;
        itemId: string;
      };
      const { entryId } = request.body as { entryId: string };

      try {
        const useCase = makeManualMatchItemUseCase();
        const result = await useCase.execute({
          tenantId,
          reconciliationId,
          itemId,
          entryId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.FINANCE.RECONCILIATION_MANUAL_MATCH,
          entityId: itemId,
          placeholders: {
            userName: userId,
            fitId: result.item.fitId,
            entryId,
          },
        });

        return reply.status(200).send(result);
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
