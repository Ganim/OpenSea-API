import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { messageTemplateResponseSchema } from '@/http/schemas/sales/message-templates/message-template.schema';
import { makeGetMessageTemplateByIdUseCase } from '@/use-cases/sales/message-templates/factories/make-get-message-template-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getMsgTemplateByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/msg-templates/:id',
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
      summary: 'Get message template by ID',
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({ messageTemplate: messageTemplateResponseSchema }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const tenantId = request.user.tenantId!;

      try {
        const useCase = makeGetMessageTemplateByIdUseCase();
        const templateResult = await useCase.execute({ tenantId, id });

        return reply.status(200).send(templateResult as any);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
