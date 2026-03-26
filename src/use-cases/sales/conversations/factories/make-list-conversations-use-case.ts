import { PrismaConversationsRepository } from '@/repositories/sales/prisma/prisma-conversations-repository';
import { ListConversationsUseCase } from '../list-conversations';

export function makeListConversationsUseCase() {
  const conversationsRepository = new PrismaConversationsRepository();
  return new ListConversationsUseCase(conversationsRepository);
}
