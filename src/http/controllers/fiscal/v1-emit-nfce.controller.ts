import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  emitNFCeBodySchema,
  fiscalDocumentResponseSchema,
} from '@/http/schemas/fiscal';
import { makeEmitNFCeUseCase } from '@/use-cases/fiscal/documents/factories/make-emit-nfce-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function emitNFCeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/fiscal/nfce',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SYSTEM.FISCAL.REGISTER,
        resource: 'fiscal',
      }),
    ],
    schema: {
      tags: ['Fiscal'],
      summary: 'Emit an NFC-e (Nota Fiscal de Consumidor Eletronica)',
      body: emitNFCeBodySchema,
      response: {
        201: z.object({ document: fiscalDocumentResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      try {
        const useCase = makeEmitNFCeUseCase();
        const { fiscalDocument } = await useCase.execute({
          tenantId,
          ...request.body,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.FISCAL.NFCE_EMIT,
          entityId: fiscalDocument.id.toString(),
          placeholders: {
            userName: request.user.sub,
            documentNumber: fiscalDocument.number,
            recipientName: fiscalDocument.recipientName,
            totalValue: fiscalDocument.totalValue.toFixed(2),
          },
          newData: {
            type: 'NFCE',
            number: fiscalDocument.number,
            status: fiscalDocument.status,
            recipientCnpjCpf: request.body.recipientCnpjCpf,
            totalValue: fiscalDocument.totalValue,
          },
        });

        return reply.status(201).send({
          document: {
            id: fiscalDocument.id.toString(),
            tenantId: fiscalDocument.tenantId.toString(),
            type: fiscalDocument.type,
            series: fiscalDocument.series,
            number: fiscalDocument.number,
            accessKey: fiscalDocument.accessKey ?? null,
            status: fiscalDocument.status,
            emissionType: fiscalDocument.emissionType,
            recipientCnpjCpf: fiscalDocument.recipientCnpjCpf,
            recipientName: fiscalDocument.recipientName,
            naturezaOperacao: fiscalDocument.naturezaOperacao,
            cfop: fiscalDocument.cfop,
            totalProducts: fiscalDocument.totalProducts,
            totalDiscount: fiscalDocument.totalDiscount,
            totalShipping: fiscalDocument.totalShipping,
            totalTax: fiscalDocument.totalTax,
            totalValue: fiscalDocument.totalValue,
            danfePdfUrl: fiscalDocument.danfePdfUrl ?? null,
            protocolNumber: fiscalDocument.protocolNumber ?? null,
            protocolDate: fiscalDocument.protocolDate ?? null,
            cancelledAt: fiscalDocument.cancelledAt ?? null,
            cancelReason: fiscalDocument.cancelReason ?? null,
            correctionText: fiscalDocument.correctionText ?? null,
            additionalInfo: fiscalDocument.additionalInfo ?? null,
            createdAt: fiscalDocument.createdAt,
            updatedAt: fiscalDocument.updatedAt ?? null,
          },
        });
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
