import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { archiveConversationParamsSchema } from '@/http/schemas/ai';
import { makeArchiveConversationUseCase } from '@/use-cases/ai/conversations/factories/make-archive-conversation-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function archiveConversationController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/ai/chat/conversations/:conversationId/archive',
    onRequest: [verifyJwt, verifyTenant],
    schema: {
      tags: ['AI - Chat'],
      summary: 'Archive a conversation',
      security: [{ bearerAuth: [] }],
      params: archiveConversationParamsSchema,
      response: {
        200: z.object({ success: z.boolean() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      const useCase = makeArchiveConversationUseCase();
      const result = await useCase.execute({
        tenantId,
        userId,
        conversationId: request.params.conversationId,
      });

      return reply.status(200).send(result);
    },
  });
}
