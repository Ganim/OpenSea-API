import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { messageTemplateResponseSchema } from '@/http/schemas/sales/message-templates/message-template.schema';
import { makeListMessageTemplatesUseCase } from '@/use-cases/sales/message-templates/factories/make-list-message-templates-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listMsgTemplatesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/sales/msg-templates',
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
      summary: 'List message templates',
      querystring: z.object({
        page: z.coerce.number().int().positive().default(1),
        perPage: z.coerce.number().int().positive().max(100).default(20),
      }),
      response: {
        200: z.object({
          messageTemplates: z.array(messageTemplateResponseSchema),
          total: z.number(),
          page: z.number(),
          perPage: z.number(),
          totalPages: z.number(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const query = request.query;
      const tenantId = request.user.tenantId!;

      const useCase = makeListMessageTemplatesUseCase();
      const listResult = await useCase.execute({ tenantId, ...query });

      return reply.status(200).send(listResult as any);
    },
  });
}
