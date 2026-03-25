import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  bulkCategorizeEntriesSchema,
  bulkOperationResultSchema,
} from '@/http/schemas/finance';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeBulkCategorizeEntriesUseCase } from '@/use-cases/finance/entries/factories/make-bulk-categorize-entries-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function bulkCategorizeEntriesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/finance/entries/bulk-categorize',
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
      summary: 'Bulk categorize multiple finance entries',
      description:
        'Change the category for multiple entries at once. The target category must exist and be active.',
      security: [{ bearerAuth: [] }],
      body: bulkCategorizeEntriesSchema,
      response: {
        200: bulkOperationResultSchema,
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user } = await getUserByIdUseCase.execute({ userId });
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const useCase = makeBulkCategorizeEntriesUseCase();
        const result = await useCase.execute({
          tenantId,
          userId,
          ...request.body,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.FINANCE.FINANCE_ENTRY_BULK_CATEGORIZE,
          entityId: request.body.entryIds[0],
          placeholders: {
            userName,
            count: result.succeeded.toString(),
          },
          newData: {
            entryIds: request.body.entryIds,
            categoryId: request.body.categoryId,
            succeeded: result.succeeded,
            failed: result.failed,
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
