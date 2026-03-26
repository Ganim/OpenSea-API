import { PrismaConversationMessagesRepository } from '@/repositories/sales/prisma/prisma-conversation-messages-repository';
import { PrismaConversationsRepository } from '@/repositories/sales/prisma/prisma-conversations-repository';
import { GetConversationByIdUseCase } from '../get-conversation-by-id';

export function makeGetConversationByIdUseCase() {
  const conversationsRepository = new PrismaConversationsRepository();
  const messagesRepository = new PrismaConversationMessagesRepository();
  return new GetConversationByIdUseCase(
    conversationsRepository,
    messagesRepository,
  );
}
