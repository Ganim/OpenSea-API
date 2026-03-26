import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { conversationResponseSchema } from '@/http/schemas/sales/conversations/conversation.schema';
import { makeGetConversationByIdUseCase } from '@/use-cases/sales/conversations/factories/make-get-conversation-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getConversationByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/conversations/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.CONVERSATIONS.ACCESS,
        resource: 'conversations',
      }),
    ],
    schema: {
      tags: ['Sales - Conversations'],
      summary: 'Get conversation by ID with messages',
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({ conversation: conversationResponseSchema }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params;
      const tenantId = request.user.tenantId!;

      try {
        const useCase = makeGetConversationByIdUseCase();
        const { conversation } = await useCase.execute({
          tenantId,
          conversationId: id,
        });

        return reply.status(200).send({ conversation });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
