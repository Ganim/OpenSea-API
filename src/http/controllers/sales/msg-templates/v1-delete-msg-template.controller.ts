import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeDeleteMessageTemplateUseCase } from '@/use-cases/sales/message-templates/factories/make-delete-message-template-use-case';
import { makeGetMessageTemplateByIdUseCase } from '@/use-cases/sales/message-templates/factories/make-get-message-template-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function deleteMsgTemplateController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/sales/msg-templates/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.MSG_TEMPLATES.REMOVE,
        resource: 'msg-templates',
      }),
    ],
    schema: {
      tags: ['Sales - Message Templates'],
      summary: 'Delete a message template (soft delete)',
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const tenantId = request.user.tenantId!;

      try {
        const getUseCase = makeGetMessageTemplateByIdUseCase();
        const { messageTemplate } = await getUseCase.execute({ tenantId, id });

        const deleteUseCase = makeDeleteMessageTemplateUseCase();
        const deleteResult = await deleteUseCase.execute({ tenantId, id });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.MESSAGE_TEMPLATE_DELETE,
          entityId: id,
          placeholders: {
            templateName: messageTemplate.name,
            userName: request.user.sub,
          },
          oldData: { id: messageTemplate.id, name: messageTemplate.name },
        });

        return reply.status(200).send(deleteResult);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
