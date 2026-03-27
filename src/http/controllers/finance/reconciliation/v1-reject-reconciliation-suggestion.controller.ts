import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { reconciliationSuggestionResponseSchema } from '@/http/schemas/finance';
import { makeRejectReconciliationSuggestionUseCase } from '@/use-cases/finance/reconciliation/factories/make-reject-reconciliation-suggestion-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function rejectReconciliationSuggestionController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/finance/reconciliation/suggestions/:id/reject',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.ENTRIES.MODIFY,
        resource: 'entries',
      }),
    ],
    schema: {
      tags: ['Finance - Reconciliation'],
      summary: 'Reject a reconciliation suggestion',
      security: [{ bearerAuth: [] }],
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        200: z.object({
          suggestion: reconciliationSuggestionResponseSchema,
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { id: suggestionId } = request.params as { id: string };

      try {
        const useCase = makeRejectReconciliationSuggestionUseCase();
        const result = await useCase.execute({
          tenantId,
          suggestionId,
          userId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.FINANCE.RECONCILIATION_SUGGESTION_REJECT,
          entityId: suggestionId,
          placeholders: {
            userName: userId,
            score: String(result.suggestion.score),
            entryId: result.suggestion.entryId,
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
