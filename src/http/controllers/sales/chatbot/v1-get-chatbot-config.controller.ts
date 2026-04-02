import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { chatbotConfigResponseSchema } from '@/http/schemas/sales/chatbot/chatbot.schema';
import { makeGetChatbotConfigUseCase } from '@/use-cases/sales/chatbot/factories/make-get-chatbot-config-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getChatbotConfigController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/sales/chatbot/config',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.CHATBOT.ACCESS,
        resource: 'chatbot',
      }),
    ],
    schema: {
      tags: ['Sales - Chatbot'],
      summary: 'Get chatbot configuration for the current tenant',
      response: {
        200: z.object({
          chatbotConfig: chatbotConfigResponseSchema.nullable(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const useCase = makeGetChatbotConfigUseCase();
      const { chatbotConfig } = await useCase.execute({ tenantId });

      return reply.status(200).send({ chatbotConfig } as unknown);
    },
  });
}
