import { PrismaConversationsRepository } from '@/repositories/sales/prisma/prisma-conversations-repository';
import { CloseConversationUseCase } from '../close-conversation';

export function makeCloseConversationUseCase() {
  const conversationsRepository = new PrismaConversationsRepository();
  return new CloseConversationUseCase(conversationsRepository);
}
