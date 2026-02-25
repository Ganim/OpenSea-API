import { PrismaEmailAccountsRepository } from '@/repositories/email/prisma/prisma-email-accounts-repository';
import { PrismaEmailFoldersRepository } from '@/repositories/email/prisma/prisma-email-folders-repository';
import { PrismaEmailMessagesRepository } from '@/repositories/email/prisma/prisma-email-messages-repository';
import { ListEmailMessagesUseCase } from '../list-email-messages';

export function makeListEmailMessagesUseCase() {
  return new ListEmailMessagesUseCase(
    new PrismaEmailAccountsRepository(),
    new PrismaEmailFoldersRepository(),
    new PrismaEmailMessagesRepository(),
  );
}
