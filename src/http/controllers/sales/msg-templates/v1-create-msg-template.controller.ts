import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createMessageTemplateSchema,
  messageTemplateResponseSchema,
} from '@/http/schemas/sales/message-templates/message-template.schema';
import { makeCreateMessageTemplateUseCase } from '@/use-cases/sales/message-templates/factories/make-create-message-template-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function createMsgTemplateController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/sales/msg-templates',
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
      summary: 'Create a new message template',
      body: createMessageTemplateSchema,
      response: {
        201: z.object({ messageTemplate: messageTemplateResponseSchema }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const body = request.body;

      try {
        const useCase = makeCreateMessageTemplateUseCase();
        const { messageTemplate } = await useCase.execute({
          tenantId,
          ...body,
          createdBy: request.user.sub,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.MESSAGE_TEMPLATE_CREATE,
          entityId: messageTemplate.id,
          placeholders: { templateName: messageTemplate.name, userName: request.user.sub },
          newData: { name: body.name, channel: body.channel },
        });

        return reply.status(201).send({ messageTemplate } as any);
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
