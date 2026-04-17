import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { financeEntryResponseSchema } from '@/http/schemas/finance';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeCreateBoletoForEntryUseCase } from '@/use-cases/finance/entries/factories/make-create-boleto-for-entry-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { ErrorCodes } from '@/@errors/error-codes';
import { errorResponseSchema } from '@/http/schemas/common/error-response.schema';

const createBoletoBodySchema = z.object({
  customerCpfCnpj: z
    .string()
    .min(11)
    .max(18)
    .describe('CPF ou CNPJ do cliente (com ou sem formatação)'),
  instructions: z
    .array(z.string().max(100))
    .max(4)
    .optional()
    .describe('Instruções do boleto (máximo 4 linhas)'),
});

const boletoResultSchema = z.object({
  chargeId: z.number().describe('ID da cobrança Efi'),
  barcodeNumber: z.string().describe('Código de barras (44 dígitos)'),
  digitableLine: z.string().describe('Linha digitável (47 dígitos formatada)'),
  pdfUrl: z.string().describe('URL do PDF do boleto'),
  dueDate: z.string().describe('Data de vencimento (YYYY-MM-DD)'),
  amount: z.number().describe('Valor em centavos'),
});

export async function createBoletoForEntryController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/finance/entries/:id/boleto',
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
      summary: 'Generate a registered boleto for a receivable entry via Efi',
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      body: createBoletoBodySchema,
      response: {
        201: z.object({
          entry: financeEntryResponseSchema,
          boleto: boletoResultSchema,
        }),
        400: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { id } = request.params as { id: string };
      const body = request.body as z.infer<typeof createBoletoBodySchema>;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user } = await getUserByIdUseCase.execute({ userId });
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const useCase = makeCreateBoletoForEntryUseCase();
        const result = await useCase.execute({
          entryId: id,
          tenantId,
          customerCpfCnpj: body.customerCpfCnpj,
          instructions: body.instructions,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.FINANCE.FINANCE_ENTRY_BOLETO_GENERATE,
          entityId: id,
          placeholders: {
            userName,
            entryCode: result.entry.code,
          },
          newData: {
            chargeId: result.boleto.chargeId,
            amount: result.boleto.amount,
          },
        });

        return reply.status(201).send(result);
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({
            code: error.code ?? ErrorCodes.BAD_REQUEST,
            message: error.message,
            requestId: request.requestId,
          });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({
            code: error.code ?? ErrorCodes.RESOURCE_NOT_FOUND,
            message: error.message,
            requestId: request.requestId,
          });
        }
        throw error;
      }
    },
  });
}
