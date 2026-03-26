import { PrismaConversationsRepository } from '@/repositories/sales/prisma/prisma-conversations-repository';
import { CreateConversationUseCase } from '../create-conversation';

export function makeCreateConversationUseCase() {
  const conversationsRepository = new PrismaConversationsRepository();
  return new CreateConversationUseCase(conversationsRepository);
}
