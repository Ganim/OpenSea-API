import { PrismaConversationMessagesRepository } from '@/repositories/sales/prisma/prisma-conversation-messages-repository';
import { PrismaConversationsRepository } from '@/repositories/sales/prisma/prisma-conversations-repository';
import { SendMessageUseCase } from '../send-message';

export function makeSendMessageUseCase() {
  const conversationsRepository = new PrismaConversationsRepository();
  const messagesRepository = new PrismaConversationMessagesRepository();
  return new SendMessageUseCase(conversationsRepository, messagesRepository);
}
