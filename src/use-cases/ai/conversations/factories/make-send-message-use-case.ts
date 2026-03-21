import { PrismaAiConversationsRepository } from '@/repositories/ai/prisma/prisma-ai-conversations-repository';
import { PrismaAiMessagesRepository } from '@/repositories/ai/prisma/prisma-ai-messages-repository';
import { SendMessageUseCase } from '../send-message';

export function makeSendMessageUseCase() {
  const conversationsRepository = new PrismaAiConversationsRepository();
  const messagesRepository = new PrismaAiMessagesRepository();
  return new SendMessageUseCase(conversationsRepository, messagesRepository);
}
