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
  createEntryFromItemBodySchema,
} from '@/http/schemas/finance';
import { makeCreateEntryFromItemUseCase } from '@/use-cases/finance/reconciliation/factories/make-create-entry-from-item-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function createEntryFromItemController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/finance/reconciliation/:id/items/:itemId/create-entry',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.ENTRIES.REGISTER,
        resource: 'entries',
      }),
    ],
    schema: {
      tags: ['Finance - Reconciliation'],
      summary: 'Create a finance entry from an unmatched reconciliation item',
      security: [{ bearerAuth: [] }],
      params: z.object({
        id: z.string().uuid(),
        itemId: z.string().uuid(),
      }),
      body: createEntryFromItemBodySchema,
      response: {
        201: z.object({
          item: reconciliationItemResponseSchema,
          entryId: z.string().uuid(),
        }),
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
      const { categoryId } = request.body as { categoryId: string };

      try {
        const useCase = makeCreateEntryFromItemUseCase();
        const result = await useCase.execute({
          tenantId,
          reconciliationId,
          itemId,
          categoryId,
          createdBy: userId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.FINANCE.RECONCILIATION_CREATE_ENTRY,
          entityId: result.entryId,
          placeholders: {
            userName: userId,
            fitId: result.item.fitId,
          },
          newData: {
            entryId: result.entryId,
            categoryId,
            amount: result.item.amount,
            type: result.item.type,
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
