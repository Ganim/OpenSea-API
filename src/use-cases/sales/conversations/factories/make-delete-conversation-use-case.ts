import { PrismaConversationsRepository } from '@/repositories/sales/prisma/prisma-conversations-repository';
import { DeleteConversationUseCase } from '../delete-conversation';

export function makeDeleteConversationUseCase() {
  const conversationsRepository = new PrismaConversationsRepository();
  return new DeleteConversationUseCase(conversationsRepository);
}
