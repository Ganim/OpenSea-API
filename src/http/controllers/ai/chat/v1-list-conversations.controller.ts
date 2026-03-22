import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  listConversationsQuerySchema,
  conversationResponseSchema,
} from '@/http/schemas/ai';
import { makeListConversationsUseCase } from '@/use-cases/ai/conversations/factories/make-list-conversations-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listConversationsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/ai/chat/conversations',
    onRequest: [verifyJwt, verifyTenant],
    schema: {
      tags: ['AI - Chat'],
      summary: 'List AI conversations',
      security: [{ bearerAuth: [] }],
      querystring: listConversationsQuerySchema,
      response: {
        200: z.object({
          conversations: z.array(conversationResponseSchema),
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

      const useCase = makeListConversationsUseCase();
      const result = await useCase.execute({
        tenantId,
        userId,
        ...request.query,
      });

      return reply.status(200).send(result);
    },
  });
}
