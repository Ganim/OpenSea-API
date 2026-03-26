import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeEmitNfeFromEntryUseCase } from '@/use-cases/finance/entries/factories/make-emit-nfe-from-entry-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const emitNfeBodySchema = z.object({
  documentType: z.enum(['NFE', 'NFSE']).describe('Tipo de documento fiscal'),
  items: z
    .array(
      z.object({
        description: z.string().min(1).max(256),
        quantity: z.number().positive(),
        unitPrice: z.number().positive(),
        ncm: z.string().max(8).optional(),
        cfop: z.string().max(4).optional(),
        issRate: z.number().min(0).max(100).optional(),
      }),
    )
    .min(1)
    .describe('Itens do documento fiscal'),
  notes: z
    .string()
    .max(2000)
    .optional()
    .describe('Informações adicionais'),
});

const fiscalDocumentResultSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  series: z.number(),
  number: z.number(),
  accessKey: z.string().optional(),
  status: z.string(),
  danfePdfUrl: z.string().optional(),
  protocolNumber: z.string().optional(),
  totalValue: z.number(),
});

export async function emitNfeFromEntryController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/finance/entries/:id/emit-nfe',
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
      summary: 'Emit NF-e or NFS-e from a receivable finance entry',
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      body: emitNfeBodySchema,
      response: {
        201: z.object({
          fiscalDocument: fiscalDocumentResultSchema,
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { id } = request.params as { id: string };
      const body = request.body as z.infer<typeof emitNfeBodySchema>;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user } = await getUserByIdUseCase.execute({ userId });
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const useCase = makeEmitNfeFromEntryUseCase();
        const result = await useCase.execute({
          entryId: id,
          tenantId,
          documentType: body.documentType,
          items: body.items,
          notes: body.notes,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.FINANCE.FINANCE_ENTRY_NFE_EMIT,
          entityId: id,
          placeholders: {
            userName,
            entryId: id,
            documentType: body.documentType,
            documentNumber: String(result.fiscalDocument.number),
          },
          newData: {
            fiscalDocumentId: result.fiscalDocument.id,
            documentType: body.documentType,
            totalValue: result.fiscalDocument.totalValue,
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
