import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { createBidDocumentSchema, bidDocumentResponseSchema } from '@/http/schemas/sales/bids/bid.schema';
import { bidDocumentToDTO } from '@/mappers/sales/bid-document/bid-document-to-dto';
import { makeCreateBidDocumentUseCase } from '@/use-cases/sales/bids/factories/make-create-bid-document-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createBidDocumentController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/bid-documents',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.BID_DOCUMENTS.REGISTER,
        resource: 'bid-documents',
      }),
    ],
    schema: {
      tags: ['Sales - Bids (Licitacoes)'],
      summary: 'Upload a bid document (certidao, atestado, etc.)',
      body: createBidDocumentSchema,
      response: {
        201: z.object({ document: bidDocumentResponseSchema }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const body = request.body;

      const useCase = makeCreateBidDocumentUseCase();
      const { document } = await useCase.execute({
        tenantId,
        ...body,
      });

      return reply.status(201).send({ document: bidDocumentToDTO(document) });
    },
  });
}
