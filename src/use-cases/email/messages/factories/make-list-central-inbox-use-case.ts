import { PrismaEmailAccountsRepository } from '@/repositories/email/prisma/prisma-email-accounts-repository';
import { PrismaEmailMessagesRepository } from '@/repositories/email/prisma/prisma-email-messages-repository';
import { ListCentralInboxUseCase } from '../list-central-inbox';

export function makeListCentralInboxUseCase() {
  return new ListCentralInboxUseCase(
    new PrismaEmailAccountsRepository(),
    new PrismaEmailMessagesRepository(),
  );
}
