import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeProcessCnabReturnUseCase } from '@/use-cases/finance/reconciliation/factories/make-process-cnab-return-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { ErrorCodes } from '@/@errors/error-codes';
import { errorResponseSchema } from '@/http/schemas/common/error-response.schema';

const cnabReturnBodySchema = z.object({
  fileContent: z.string().min(1, 'File content is required'),
  bankAccountId: z.string().uuid(),
});

const cnabReturnDetailSchema = z.object({
  boletoNumber: z.string(),
  amount: z.number(),
  status: z.enum(['MATCHED', 'NOT_FOUND', 'ALREADY_PAID', 'ERROR']),
  entryId: z.string().optional(),
  errorMessage: z.string().optional(),
});

const cnabReturnResponseSchema = z.object({
  processed: z.number(),
  matched: z.number(),
  unmatched: z.number(),
  errors: z.array(z.string()),
  details: z.array(cnabReturnDetailSchema),
});

export async function processCnabReturnController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/finance/reconciliation/cnab-return',
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
      summary: 'Process CNAB 240 return file for boleto reconciliation',
      description:
        'Parses a CNAB 240 return file and auto-reconciles boleto payments with pending finance entries.',
      security: [{ bearerAuth: [] }],
      body: cnabReturnBodySchema,
      response: {
        200: cnabReturnResponseSchema,
        400: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { fileContent, bankAccountId } = request.body;

      try {
        const useCase = makeProcessCnabReturnUseCase();
        const cnabResult = await useCase.execute({
          tenantId,
          fileContent,
          bankAccountId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.FINANCE.RECONCILIATION_IMPORT,
          entityId: bankAccountId,
          placeholders: {
            userName: userId,
            fileName: 'CNAB-240-return',
            transactionCount: cnabResult.processed,
          },
          newData: {
            processed: cnabResult.processed,
            matched: cnabResult.matched,
            unmatched: cnabResult.unmatched,
            bankAccountId,
          },
        });

        return reply.status(200).send(cnabResult);
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
