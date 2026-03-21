import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  getConversationParamsSchema,
  getConversationQuerySchema,
  conversationResponseSchema,
  messageResponseSchema,
} from '@/http/schemas/ai';
import { makeGetConversationUseCase } from '@/use-cases/ai/conversations/factories/make-get-conversation-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getConversationController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/ai/chat/conversations/:conversationId',
    onRequest: [verifyJwt, verifyTenant],
    schema: {
      tags: ['AI - Chat'],
      summary: 'Get a conversation with messages',
      security: [{ bearerAuth: [] }],
      params: getConversationParamsSchema,
      querystring: getConversationQuerySchema,
      response: {
        200: z.object({
          conversation: conversationResponseSchema,
          messages: z.array(messageResponseSchema),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            pages: z.number(),
          }),
        }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      const useCase = makeGetConversationUseCase();
      const result = await useCase.execute({
        tenantId,
        userId,
        conversationId: request.params.conversationId,
        ...request.query,
      });

      return reply.status(200).send(result);
    },
  });
}
