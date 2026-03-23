import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  bidDocumentResponseSchema,
  uploadBidDocumentSchema,
} from '@/http/schemas/sales/bids';
import { makeUploadBidDocumentUseCase } from '@/use-cases/sales/bids/factories/make-upload-bid-document-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function uploadBidDocumentController(app: FastifyInstance) {
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
      tags: ['Sales - Bid Documents'],
      summary: 'Upload a bid document',
      body: uploadBidDocumentSchema,
      response: {
        201: z.object({ document: bidDocumentResponseSchema }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const body = request.body;

      const useCase = makeUploadBidDocumentUseCase();
      const { document } = (await useCase.execute({
        tenantId,
        ...body,
      })) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

      await logAudit(request, {
        message: AUDIT_MESSAGES.SALES.BID_DOCUMENT_CREATE,
        entityId: document.id.toString(),
        placeholders: { userName: userId, documentName: body.name },
        newData: { name: body.name, bidId: body.bidId },
      });

      return reply.status(201).send({ document });
    },
  });
}
