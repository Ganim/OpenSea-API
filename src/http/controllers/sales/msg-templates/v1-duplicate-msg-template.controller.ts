import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { messageTemplateResponseSchema } from '@/http/schemas/sales/message-templates/message-template.schema';
import { makeDuplicateMessageTemplateUseCase } from '@/use-cases/sales/message-templates/factories/make-duplicate-message-template-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function duplicateMsgTemplateController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/sales/msg-templates/:id/duplicate',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.MSG_TEMPLATES.REGISTER,
        resource: 'msg-templates',
      }),
    ],
    schema: {
      tags: ['Sales - Message Templates'],
      summary: 'Duplicate a message template',
      params: z.object({ id: z.string().uuid() }),
      response: {
        201: z.object({ messageTemplate: messageTemplateResponseSchema }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const tenantId = request.user.tenantId!;

      try {
        const useCase = makeDuplicateMessageTemplateUseCase();
        const { messageTemplate } = await useCase.execute({
          tenantId,
          id,
          createdBy: request.user.sub,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.MESSAGE_TEMPLATE_DUPLICATE,
          entityId: messageTemplate.id,
          placeholders: { templateName: messageTemplate.name, userName: request.user.sub },
          newData: { sourceId: id, duplicatedName: messageTemplate.name },
        });

        return reply.status(201).send({ messageTemplate } as any);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
