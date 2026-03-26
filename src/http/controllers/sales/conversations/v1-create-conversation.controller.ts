import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  conversationResponseSchema,
  createConversationSchema,
} from '@/http/schemas/sales/conversations/conversation.schema';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeCreateConversationUseCase } from '@/use-cases/sales/conversations/factories/make-create-conversation-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function createConversationController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/conversations',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.CONVERSATIONS.REGISTER,
        resource: 'conversations',
      }),
    ],
    schema: {
      tags: ['Sales - Conversations'],
      summary: 'Create a new conversation',
      body: createConversationSchema,
      response: {
        201: z.object({ conversation: conversationResponseSchema }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const body = request.body;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user } = await getUserByIdUseCase.execute({ userId });
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const useCase = makeCreateConversationUseCase();
        const { conversation } = await useCase.execute({
          tenantId,
          customerId: body.customerId,
          subject: body.subject,
          createdBy: userId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.CONVERSATION_CREATE,
          entityId: conversation.id,
          placeholders: { userName, conversationSubject: conversation.subject },
          newData: { subject: body.subject, customerId: body.customerId },
        });

        return reply.status(201).send({ conversation } as any);
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
