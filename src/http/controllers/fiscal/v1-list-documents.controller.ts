import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  fiscalDocumentResponseSchema,
  listFiscalDocumentsQuerySchema,
} from '@/http/schemas/fiscal';
import { makeListFiscalDocumentsUseCase } from '@/use-cases/fiscal/documents/factories/make-list-fiscal-documents-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listDocumentsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/fiscal/documents',
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
      summary: 'List fiscal documents with pagination and filters',
      querystring: listFiscalDocumentsQuerySchema,
      response: {
        200: z.object({
          data: z.array(fiscalDocumentResponseSchema),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            pages: z.number(),
          }),
        }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const query = request.query;

      const useCase = makeListFiscalDocumentsUseCase();
      const { documents, total, page, limit, totalPages } =
        await useCase.execute({
          tenantId,
          page: query.page,
          limit: query.limit,
          type: query.type,
          status: query.status,
          startDate: query.startDate,
          endDate: query.endDate,
        });

      return reply.status(200).send({
        data: documents.map((doc) => ({
          id: doc.id.toString(),
          tenantId: doc.tenantId.toString(),
          type: doc.type,
          series: doc.series,
          number: doc.number,
          accessKey: doc.accessKey ?? null,
          status: doc.status,
          emissionType: doc.emissionType,
          recipientCnpjCpf: doc.recipientCnpjCpf,
          recipientName: doc.recipientName,
          naturezaOperacao: doc.naturezaOperacao,
          cfop: doc.cfop,
          totalProducts: doc.totalProducts,
          totalDiscount: doc.totalDiscount,
          totalShipping: doc.totalShipping,
          totalTax: doc.totalTax,
          totalValue: doc.totalValue,
          danfePdfUrl: doc.danfePdfUrl ?? null,
          protocolNumber: doc.protocolNumber ?? null,
          protocolDate: doc.protocolDate ?? null,
          cancelledAt: doc.cancelledAt ?? null,
          cancelReason: doc.cancelReason ?? null,
          correctionText: doc.correctionText ?? null,
          additionalInfo: doc.additionalInfo ?? null,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt ?? null,
        })),
        meta: {
          total,
          page,
          limit,
          pages: totalPages,
        },
      });
    },
  });
}
