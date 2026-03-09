import { PrismaEmailAccountsRepository } from '@/repositories/email/prisma/prisma-email-accounts-repository';
import { PrismaEmailMessagesRepository } from '@/repositories/email/prisma/prisma-email-messages-repository';
import { SuggestEmailContactsUseCase } from '../suggest-email-contacts';

export function makeSuggestEmailContactsUseCase() {
  return new SuggestEmailContactsUseCase(
    new PrismaEmailAccountsRepository(),
    new PrismaEmailMessagesRepository(),
  );
}
