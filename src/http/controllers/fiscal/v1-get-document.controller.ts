import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  fiscalDocumentDetailResponseSchema,
  fiscalDocumentParamsSchema,
} from '@/http/schemas/fiscal';
import { makeGetFiscalDocumentUseCase } from '@/use-cases/fiscal/documents/factories/make-get-fiscal-document-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getDocumentController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/fiscal/documents/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SYSTEM.FISCAL.ACCESS,
        resource: 'fiscal',
      }),
    ],
    schema: {
      tags: ['Fiscal'],
      summary: 'Get fiscal document details with items and events',
      params: fiscalDocumentParamsSchema,
      response: {
        200: z.object({ document: fiscalDocumentDetailResponseSchema }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id: documentId } = request.params;

      try {
        const useCase = makeGetFiscalDocumentUseCase();
        const { fiscalDocument, documentItems, documentEvents } =
          await useCase.execute({
            tenantId,
            documentId,
          });

        return reply.status(200).send({
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
            items: documentItems.map((item) => ({
              id: item.id.toString(),
              itemNumber: item.itemNumber,
              productName: item.productName,
              productCode: item.productCode,
              ncm: item.ncm,
              cfop: item.cfop,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              discount: item.discount,
              cst: item.cst,
              icmsValue: item.icmsValue,
              ipiValue: item.ipiValue,
              pisValue: item.pisValue,
              cofinsValue: item.cofinsValue,
            })),
            events: documentEvents.map((event) => ({
              id: event.id.toString(),
              type: event.type,
              protocol: event.protocol ?? null,
              description: event.description,
              success: event.success,
              errorCode: event.errorCode ?? null,
              errorMessage: event.errorMessage ?? null,
              createdAt: event.createdAt,
            })),
          },
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
