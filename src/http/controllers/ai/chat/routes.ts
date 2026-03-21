import type { FastifyInstance } from 'fastify';

import { sendMessageController } from './v1-send-message.controller';
import { listConversationsController } from './v1-list-conversations.controller';
import { getConversationController } from './v1-get-conversation.controller';
import { archiveConversationController } from './v1-archive-conversation.controller';

export async function aiChatRoutes(app: FastifyInstance) {
  app.register(sendMessageController);
  app.register(listConversationsController);
  app.register(getConversationController);
  app.register(archiveConversationController);
}
