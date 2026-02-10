import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeDeleteAttachmentUseCase } from '@/use-cases/finance/attachments/factories/make-delete-attachment-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function deleteAttachmentController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/finance/entries/:id/attachments/:attachmentId',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.ATTACHMENTS.DELETE,
        resource: 'attachments',
      }),
    ],
    schema: {
      tags: ['Finance - Attachments'],
      summary: 'Delete an attachment from a finance entry',
      security: [{ bearerAuth: [] }],
      params: z.object({
        id: z.string().uuid(),
        attachmentId: z.string().uuid(),
      }),
      response: {
        204: z.null().describe('Attachment deleted successfully'),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id: entryId, attachmentId } = request.params as {
        id: string;
        attachmentId: string;
      };

      try {
        const useCase = makeDeleteAttachmentUseCase();
        await useCase.execute({
          tenantId,
          entryId,
          attachmentId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.FINANCE.FINANCE_ATTACHMENT_DELETE,
          entityId: attachmentId,
          placeholders: {
            userName: request.user.sub,
            fileName: attachmentId,
            entryCode: entryId,
          },
        });

        return reply.status(204).send();
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
