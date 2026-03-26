import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { previewMessageTemplateSchema } from '@/http/schemas/sales/message-templates/message-template.schema';
import { makePreviewMessageTemplateUseCase } from '@/use-cases/sales/message-templates/factories/make-preview-message-template-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function previewMsgTemplateController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/msg-templates/:id/preview',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.MSG_TEMPLATES.ACCESS,
        resource: 'msg-templates',
      }),
    ],
    schema: {
      tags: ['Sales - Message Templates'],
      summary: 'Preview a message template with sample data',
      params: z.object({ id: z.string().uuid() }),
      body: previewMessageTemplateSchema,
      response: {
        200: z.object({
          templateName: z.string(),
          channel: z.string(),
          subject: z.string().optional(),
          renderedBody: z.string(),
          variables: z.array(z.string()),
        }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const tenantId = request.user.tenantId!;
      const { sampleData } = request.body;

      try {
        const useCase = makePreviewMessageTemplateUseCase();
        const previewResult = await useCase.execute({ tenantId, id, sampleData });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.MESSAGE_TEMPLATE_PREVIEW,
          entityId: id,
          placeholders: { templateName: previewResult.templateName, userName: request.user.sub },
        });

        return reply.status(200).send(previewResult);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
