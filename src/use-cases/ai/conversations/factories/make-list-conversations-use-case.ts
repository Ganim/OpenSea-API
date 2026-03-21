import { PrismaAiConversationsRepository } from '@/repositories/ai/prisma/prisma-ai-conversations-repository';
import { ListConversationsUseCase } from '../list-conversations';

export function makeListConversationsUseCase() {
  const conversationsRepository = new PrismaAiConversationsRepository();
  return new ListConversationsUseCase(conversationsRepository);
}
