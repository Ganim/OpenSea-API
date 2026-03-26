import { PrismaConversationsRepository } from '@/repositories/sales/prisma/prisma-conversations-repository';
import { ArchiveConversationUseCase } from '../archive-conversation';

export function makeArchiveConversationUseCase() {
  const conversationsRepository = new PrismaConversationsRepository();
  return new ArchiveConversationUseCase(conversationsRepository);
}
