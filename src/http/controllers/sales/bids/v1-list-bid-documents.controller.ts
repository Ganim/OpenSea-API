import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { listBidDocumentsQuerySchema, bidDocumentResponseSchema } from '@/http/schemas/sales/bids/bid.schema';
import { bidDocumentToDTO } from '@/mappers/sales/bid-document/bid-document-to-dto';
import { makeListBidDocumentsUseCase } from '@/use-cases/sales/bids/factories/make-list-bid-documents-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listBidDocumentsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/bid-documents',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.BID_DOCUMENTS.ACCESS,
        resource: 'bid-documents',
      }),
    ],
    schema: {
      tags: ['Sales - Bids (Licitacoes)'],
      summary: 'List bid documents',
      querystring: listBidDocumentsQuerySchema,
      response: {
        200: z.object({
          documents: z.array(bidDocumentResponseSchema),
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

      const useCase = makeListBidDocumentsUseCase();
      const { documents, total, page, limit, totalPages } = await useCase.execute({
        tenantId,
        ...query,
      });

      return reply.status(200).send({
        documents: documents.map(bidDocumentToDTO),
        meta: { total, page, limit, pages: totalPages },
      });
    },
  });
}
