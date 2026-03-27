import { PrismaConversationMessagesRepository } from '@/repositories/sales/prisma/prisma-conversation-messages-repository';
import { PrismaConversationsRepository } from '@/repositories/sales/prisma/prisma-conversations-repository';
import { GetConversationSentimentUseCase } from '../get-conversation-sentiment';

export function makeGetConversationSentimentUseCase() {
  const conversationsRepository = new PrismaConversationsRepository();
  const conversationMessagesRepository =
    new PrismaConversationMessagesRepository();

  return new GetConversationSentimentUseCase(
    conversationsRepository,
    conversationMessagesRepository,
  );
}
