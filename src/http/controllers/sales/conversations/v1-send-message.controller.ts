import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  conversationMessageResponseSchema,
  sendMessageSchema,
} from '@/http/schemas/sales/conversations/conversation.schema';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeSendMessageUseCase } from '@/use-cases/sales/conversations/factories/make-send-message-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function sendMessageController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/conversations/:id/messages',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.CONVERSATIONS.REPLY,
        resource: 'conversations',
      }),
    ],
    schema: {
      tags: ['Sales - Conversations'],
      summary: 'Send a message to a conversation',
      params: z.object({ id: z.string().uuid() }),
      body: sendMessageSchema,
      response: {
        201: z.object({ message: conversationMessageResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { id } = request.params;
      const body = request.body;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user } = await getUserByIdUseCase.execute({ userId });
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const useCase = makeSendMessageUseCase();
        const { message } = await useCase.execute({
          tenantId,
          conversationId: id,
          senderId: userId,
          senderName: body.senderName,
          senderType: body.senderType,
          content: body.content,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.CONVERSATION_MESSAGE_SEND,
          entityId: message.id,
          placeholders: { userName },
          newData: { conversationId: id, senderType: body.senderType },
        });

        return reply.status(201).send({ message });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
