import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { sentimentSummaryResponseSchema } from '@/http/schemas/sales/sentiment/sentiment.schema';
import { makeGetConversationSentimentUseCase } from '@/use-cases/sales/sentiment/factories/make-get-conversation-sentiment-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getConversationSentimentController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/sales/conversations/:id/sentiment',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.SENTIMENT.ACCESS,
        resource: 'sentiment',
      }),
    ],
    schema: {
      tags: ['Sales - Sentiment'],
      summary: 'Get sentiment summary for a conversation',
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        200: sentimentSummaryResponseSchema,
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id: conversationId } = request.params;

      try {
        const useCase = makeGetConversationSentimentUseCase();
        const result = await useCase.execute({ tenantId, conversationId });

        return reply.status(200).send(result as any);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
