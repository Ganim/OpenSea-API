import { PrismaChatbotConfigsRepository } from '@/repositories/sales/prisma/prisma-chatbot-configs-repository';
import { PrismaConversationMessagesRepository } from '@/repositories/sales/prisma/prisma-conversation-messages-repository';
import { PrismaConversationsRepository } from '@/repositories/sales/prisma/prisma-conversations-repository';
import { PrismaCustomersRepository } from '@/repositories/sales/prisma/prisma-customers-repository';
import { HandleChatbotMessageUseCase } from '../handle-chatbot-message';

export function makeHandleChatbotMessageUseCase() {
  const chatbotConfigsRepository = new PrismaChatbotConfigsRepository();
  const conversationsRepository = new PrismaConversationsRepository();
  const conversationMessagesRepository =
    new PrismaConversationMessagesRepository();
  const customersRepository = new PrismaCustomersRepository();

  return new HandleChatbotMessageUseCase(
    chatbotConfigsRepository,
    conversationsRepository,
    conversationMessagesRepository,
    customersRepository,
  );
}
