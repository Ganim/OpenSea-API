import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { financeAttachmentResponseSchema } from '@/http/schemas/finance';
import { makeUploadAttachmentUseCase } from '@/use-cases/finance/attachments/factories/make-upload-attachment-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function uploadAttachmentController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/finance/entries/:id/attachments',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.ATTACHMENTS.CREATE,
        resource: 'attachments',
      }),
    ],
    schema: {
      tags: ['Finance - Attachments'],
      summary: 'Upload an attachment to a finance entry',
      description:
        'Upload a file (PDF, JPEG, PNG, max 10MB) as a multipart/form-data request. Include a "file" field with the file and optionally a "type" field (BOLETO, PAYMENT_RECEIPT, CONTRACT, INVOICE, OTHER).',
      security: [{ bearerAuth: [] }],
      consumes: ['multipart/form-data'],
      params: z.object({ id: z.string().uuid() }),
      response: {
        201: z.object({ attachment: financeAttachmentResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { id: entryId } = request.params as { id: string };

      try {
        const data = await request.file();

        if (!data) {
          return reply.status(400).send({ message: 'No file uploaded' });
        }

        const fileBuffer = await data.toBuffer();
        const type = (data.fields.type as { value?: string })?.value || 'OTHER';

        const useCase = makeUploadAttachmentUseCase();
        const result = await useCase.execute({
          tenantId,
          entryId,
          type,
          fileName: data.filename,
          fileBuffer,
          mimeType: data.mimetype,
          uploadedBy: userId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.FINANCE.FINANCE_ATTACHMENT_UPLOAD,
          entityId: result.attachment.id,
          placeholders: {
            userName: userId,
            fileName: data.filename,
            entryCode: entryId,
          },
          newData: {
            fileName: data.filename,
            type,
            mimeType: data.mimetype,
            fileSize: fileBuffer.length,
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
