import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { sentimentAnalysisResponseSchema } from '@/http/schemas/sales/sentiment/sentiment.schema';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeAnalyzeSentimentUseCase } from '@/use-cases/sales/sentiment/factories/make-analyze-sentiment-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function analyzeSentimentController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/sales/conversations/:id/sentiment',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.SENTIMENT.EXECUTE,
        resource: 'sentiment',
      }),
    ],
    schema: {
      tags: ['Sales - Sentiment'],
      summary: 'Analyze sentiment for all messages in a conversation',
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        200: sentimentAnalysisResponseSchema,
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { id: conversationId } = request.params;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user } = await getUserByIdUseCase.execute({ userId });
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const useCase = makeAnalyzeSentimentUseCase();
        const result = await useCase.execute({ tenantId, conversationId });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.SENTIMENT_ANALYZE,
          entityId: conversationId,
          placeholders: {
            userName,
            overallSentiment: result.overallSentiment,
          },
        });

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
