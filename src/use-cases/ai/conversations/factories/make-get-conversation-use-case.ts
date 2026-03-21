import { PrismaAiConversationsRepository } from '@/repositories/ai/prisma/prisma-ai-conversations-repository';
import { PrismaAiMessagesRepository } from '@/repositories/ai/prisma/prisma-ai-messages-repository';
import { GetConversationUseCase } from '../get-conversation';

export function makeGetConversationUseCase() {
  const conversationsRepository = new PrismaAiConversationsRepository();
  const messagesRepository = new PrismaAiMessagesRepository();
  return new GetConversationUseCase(conversationsRepository, messagesRepository);
}
