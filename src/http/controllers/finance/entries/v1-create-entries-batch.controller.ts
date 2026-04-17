import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { ErrorCodes } from '@/@errors/error-codes';
import { errorResponseSchema } from '@/http/schemas/common/error-response.schema';
import {
  batchCreateResponseSchema,
  createFinanceEntriesBatchSchema,
} from '@/http/schemas/finance';
import { makeCreateFinanceEntriesBatchUseCase } from '@/use-cases/finance/entries/factories/make-create-finance-entries-batch';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function createEntriesBatchController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/finance/entries/batch',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.ENTRIES.REGISTER,
        resource: 'entries',
      }),
    ],
    schema: {
      tags: ['Finance - Entries'],
      summary: 'Create finance entries in batch (up to 20)',
      security: [{ bearerAuth: [] }],
      body: createFinanceEntriesBatchSchema,
      response: {
        201: batchCreateResponseSchema,
        400: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      try {
        const useCase = makeCreateFinanceEntriesBatchUseCase();
        const result = await useCase.execute({
          entries: request.body.entries,
          userId,
          tenantId,
        });

        for (const entry of result.entries) {
          await logAudit(request, {
            message: AUDIT_MESSAGES.FINANCE.FINANCE_ENTRY_CREATE,
            entityId: entry.id,
            placeholders: { userName: userId, entryCode: entry.code },
            newData: { batchCreate: true },
          });
        }

        return reply.status(201).send(result);
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({
            code: error.code ?? ErrorCodes.BAD_REQUEST,
            message: error.message,
            requestId: request.requestId,
          });
        }
        throw error;
      }
    },
  });
}
