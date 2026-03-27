import { PrismaConversationMessagesRepository } from '@/repositories/sales/prisma/prisma-conversation-messages-repository';
import { PrismaConversationsRepository } from '@/repositories/sales/prisma/prisma-conversations-repository';
import { AnalyzeSentimentUseCase } from '../analyze-sentiment';

export function makeAnalyzeSentimentUseCase() {
  const conversationsRepository = new PrismaConversationsRepository();
  const conversationMessagesRepository =
    new PrismaConversationMessagesRepository();

  return new AnalyzeSentimentUseCase(
    conversationsRepository,
    conversationMessagesRepository,
  );
}
