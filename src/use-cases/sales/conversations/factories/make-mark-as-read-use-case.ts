import { PrismaConversationMessagesRepository } from '@/repositories/sales/prisma/prisma-conversation-messages-repository';
import { PrismaConversationsRepository } from '@/repositories/sales/prisma/prisma-conversations-repository';
import { MarkAsReadUseCase } from '../mark-as-read';

export function makeMarkAsReadUseCase() {
  const conversationsRepository = new PrismaConversationsRepository();
  const messagesRepository = new PrismaConversationMessagesRepository();
  return new MarkAsReadUseCase(conversationsRepository, messagesRepository);
}
