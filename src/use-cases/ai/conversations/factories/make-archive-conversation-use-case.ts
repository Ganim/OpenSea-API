import { PrismaAiConversationsRepository } from '@/repositories/ai/prisma/prisma-ai-conversations-repository';
import { ArchiveConversationUseCase } from '../archive-conversation';

export function makeArchiveConversationUseCase() {
  const conversationsRepository = new PrismaAiConversationsRepository();
  return new ArchiveConversationUseCase(conversationsRepository);
}
