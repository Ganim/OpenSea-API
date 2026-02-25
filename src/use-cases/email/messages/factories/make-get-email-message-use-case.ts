import { PrismaEmailAccountsRepository } from '@/repositories/email/prisma/prisma-email-accounts-repository';
import { PrismaEmailMessagesRepository } from '@/repositories/email/prisma/prisma-email-messages-repository';
import { GetEmailMessageUseCase } from '../get-email-message';

export function makeGetEmailMessageUseCase() {
  return new GetEmailMessageUseCase(
    new PrismaEmailAccountsRepository(),
    new PrismaEmailMessagesRepository(),
  );
}
