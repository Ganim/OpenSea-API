import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { reconciliationResponseSchema } from '@/http/schemas/finance';
import { makeImportOfxReconciliationUseCase } from '@/use-cases/finance/reconciliation/factories/make-import-ofx-reconciliation-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function importOfxReconciliationController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/finance/reconciliation/import',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.BANK_ACCOUNTS.IMPORT,
        resource: 'bank-accounts',
      }),
    ],
    schema: {
      tags: ['Finance - Reconciliation'],
      summary: 'Import OFX file for bank reconciliation',
      description:
        'Upload an OFX/OFC file (max 5MB) as multipart/form-data. Include a "file" field with the OFX file and a "bankAccountId" field.',
      security: [{ bearerAuth: [] }],
      consumes: ['multipart/form-data'],
      response: {
        201: z.object({ reconciliation: reconciliationResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      try {
        const fileData = await request.file();

        if (!fileData) {
          return reply.status(400).send({ message: 'No file uploaded' });
        }

        const fileBuffer = await fileData.toBuffer();
        const bankAccountId = (
          fileData.fields.bankAccountId as { value?: string }
        )?.value;

        if (!bankAccountId) {
          return reply
            .status(400)
            .send({ message: 'bankAccountId is required' });
        }

        const useCase = makeImportOfxReconciliationUseCase();
        const result = await useCase.execute({
          tenantId,
          bankAccountId,
          fileName: fileData.filename,
          fileBuffer,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.FINANCE.RECONCILIATION_IMPORT,
          entityId: result.reconciliation.id,
          placeholders: {
            userName: userId,
            fileName: fileData.filename,
            transactionCount: result.reconciliation.totalTransactions,
          },
          newData: {
            fileName: fileData.filename,
            bankAccountId,
            totalTransactions: result.reconciliation.totalTransactions,
            matchedCount: result.reconciliation.matchedCount,
            unmatchedCount: result.reconciliation.unmatchedCount,
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
