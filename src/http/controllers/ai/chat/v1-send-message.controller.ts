import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  sendMessageBodySchema,
  messageResponseSchema,
} from '@/http/schemas/ai';
import { makeSendMessageUseCase } from '@/use-cases/ai/conversations/factories/make-send-message-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function sendMessageController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/ai/chat',
    onRequest: [verifyJwt, verifyTenant],
    schema: {
      tags: ['AI - Chat'],
      summary: 'Send a message to the AI assistant',
      security: [{ bearerAuth: [] }],
      body: sendMessageBodySchema,
      response: {
        200: z.object({
          conversationId: z.string(),
          userMessage: messageResponseSchema,
          assistantMessage: messageResponseSchema,
        }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      const useCase = makeSendMessageUseCase();
      const result = await useCase.execute({
        tenantId,
        userId,
        ...request.body,
      });

      return reply.status(200).send(result);
    },
  });
}
