import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { archiveConversationController } from './v1-archive-conversation.controller';
import { closeConversationController } from './v1-close-conversation.controller';
import { createConversationController } from './v1-create-conversation.controller';
import { deleteConversationController } from './v1-delete-conversation.controller';
import { getConversationByIdController } from './v1-get-conversation-by-id.controller';
import { listConversationsController } from './v1-list-conversations.controller';
import { markAsReadController } from './v1-mark-as-read.controller';
import { sendMessageController } from './v1-send-message.controller';

export async function conversationsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  await app.register(listConversationsController);
  await app.register(getConversationByIdController);
  await app.register(createConversationController);
  await app.register(sendMessageController);
  await app.register(markAsReadController);
  await app.register(closeConversationController);
  await app.register(archiveConversationController);
  await app.register(deleteConversationController);
}
