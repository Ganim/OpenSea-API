import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  bulkPayEntriesSchema,
  bulkOperationResultSchema,
} from '@/http/schemas/finance';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeBulkPayEntriesUseCase } from '@/use-cases/finance/entries/factories/make-bulk-pay-entries-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function bulkPayEntriesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/finance/entries/bulk-pay',
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
      summary: 'Bulk pay multiple finance entries',
      description:
        'Register full payment for multiple entries at once. Each entry is paid in full (remaining balance).',
      security: [{ bearerAuth: [] }],
      body: bulkPayEntriesSchema,
      response: {
        200: bulkOperationResultSchema,
        400: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const { user } = await getUserByIdUseCase.execute({ userId });
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const useCase = makeBulkPayEntriesUseCase();
      const result = await useCase.execute({
        tenantId,
        userId,
        ...request.body,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.FINANCE.FINANCE_ENTRY_BULK_PAY,
        entityId: request.body.entryIds[0],
        placeholders: {
          userName,
          count: result.succeeded.toString(),
        },
        newData: {
          entryIds: request.body.entryIds,
          succeeded: result.succeeded,
          failed: result.failed,
        },
      });

      return reply.status(200).send(result);
    },
  });
}
