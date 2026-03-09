import { PrismaEmailMessagesRepository } from '@/repositories/email/prisma/prisma-email-messages-repository';
import { ListThreadMessagesUseCase } from '../list-thread-messages';

export function makeListThreadMessagesUseCase() {
  return new ListThreadMessagesUseCase(new PrismaEmailMessagesRepository());
}
