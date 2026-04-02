import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  updateMessageTemplateSchema,
  messageTemplateResponseSchema,
} from '@/http/schemas/sales/message-templates/message-template.schema';
import { makeUpdateMessageTemplateUseCase } from '@/use-cases/sales/message-templates/factories/make-update-message-template-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function updateMsgTemplateController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/sales/msg-templates/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.MSG_TEMPLATES.MODIFY,
        resource: 'msg-templates',
      }),
    ],
    schema: {
      tags: ['Sales - Message Templates'],
      summary: 'Update a message template',
      params: z.object({ id: z.string().uuid() }),
      body: updateMessageTemplateSchema,
      response: {
        200: z.object({ messageTemplate: messageTemplateResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const tenantId = request.user.tenantId!;
      const body = request.body;

      try {
        const useCase = makeUpdateMessageTemplateUseCase();
        const { messageTemplate } = await useCase.execute({
          tenantId,
          id,
          ...body,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.MESSAGE_TEMPLATE_UPDATE,
          entityId: id,
          placeholders: {
            templateName: messageTemplate.name,
            userName: request.user.sub,
          },
          newData: body,
        });

        return reply.status(200).send({ messageTemplate } as unknown);
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
